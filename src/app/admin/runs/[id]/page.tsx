import * as React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AuditResultRenderer } from "@/components/audit/audit-result-renderer";

type Params = { id: string };

type RunDetail = {
    id: string;
    user_id: string;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    analyzed_at: string | null;

    intake: any;
    result: any;

    summary: string | null;
    error: string | null;
    error_stage: string | null;

    prompt_version: string | null;
    schema_version: string | null;
    model: string | null;

    admin_notes: string | null;
    qa_tags: string[] | null;
    needs_prompt_tuning: boolean;
};

type ProfileMini = {
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
};

function fmt(dt: string | null) {
    if (!dt) return "—";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

function prettyJson(value: any) {
    try {
        return JSON.stringify(value ?? null, null, 2);
    } catch {
        return String(value);
    }
}

function tagsToString(tags: string[] | null | undefined) {
    if (!tags || tags.length === 0) return "";
    return tags.join(", ");
}

function parseTags(input: string) {
    const parts = input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of parts) {
        const key = t.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(t);
        }
    }
    return out;
}

export default async function AdminRunDetailPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: run, error: runError } = await supabase
        .from("audit_runs")
        .select(
            "id,user_id,status,created_at,updated_at,analyzed_at,intake,result,summary,error,error_stage,prompt_version,schema_version,model,admin_notes,qa_tags,needs_prompt_tuning"
        )
        .eq("id", id)
        .maybeSingle();

    if (runError) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">Run Detail</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin/runs">Back</Link>
                    </Button>
                </div>
                <p className="text-sm text-destructive">Failed to load run: {runError.message}</p>
            </div>
        );
    }

    if (!run) notFound();
    const r = run as RunDetail;

    // ✅ Server Action: update QA fields (self-contained; no helper function)
    async function updateQa(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) redirect("/");

        const { data: adminRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (!adminRole) redirect("/dashboard");

        const admin_notes = String(formData.get("admin_notes") ?? "").trim();
        const tagsInput = String(formData.get("qa_tags") ?? "");
        const needs_prompt_tuning = formData.get("needs_prompt_tuning") === "on";

        const qa_tags = parseTags(tagsInput);

        const { error } = await supabase
            .from("audit_runs")
            .update({
                admin_notes: admin_notes.length ? admin_notes : null,
                qa_tags: qa_tags.length ? qa_tags : null,
                needs_prompt_tuning,
            })
            .eq("id", id);

        if (error) throw new Error(error.message);

        redirect(`/admin/runs/${id}`);
    }

    // ✅ Server Action: replay run (self-contained; no helper function)
    async function replayRun() {
        "use server";

        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) redirect("/");

        const { data: adminRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (!adminRole) redirect("/dashboard");

        const { data: inserted, error } = await supabase
            .from("audit_runs")
            .insert({
                user_id: r.user_id,
                intake: r.intake,
                status: "submitted",
                prompt_version: r.prompt_version,
                schema_version: r.schema_version,
                model: r.model,
            })
            .select("id")
            .single();

        if (error) throw new Error(error.message);

        redirect(`/admin/runs/${inserted.id}`);
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,full_name,business_name,phone")
        .eq("id", r.user_id)
        .maybeSingle();

    const p = (profile ?? null) as ProfileMini | null;

    const clientLabel =
        p?.email ?? p?.full_name ?? p?.business_name ?? `${r.user_id.slice(0, 8)}…`;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Run Detail</h1>
                    <p className="text-sm text-muted-foreground">
                        Inspect what the client submitted (intake) and what the system produced (result).
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/runs">Back to Runs</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Users</Link>
                    </Button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="rounded-lg border bg-background p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Run ID</div>
                        <div className="font-mono text-xs">{r.id}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Status</div>
                        <div className="text-sm">
                            <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                {r.status ?? "—"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Client</div>
                        <div className="text-sm">{clientLabel}</div>
                        {p?.business_name ? (
                            <div className="text-xs text-muted-foreground">{p.business_name}</div>
                        ) : null}
                        {profileError ? (
                            <div className="text-xs text-destructive">
                                Client lookup failed: {profileError.message}
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Client Phone</div>
                        <div className="text-sm">{p?.phone ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Created</div>
                        <div className="text-sm text-muted-foreground">{fmt(r.created_at)}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Analyzed</div>
                        <div className="text-sm text-muted-foreground">{fmt(r.analyzed_at)}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Updated</div>
                        <div className="text-sm text-muted-foreground">{fmt(r.updated_at)}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Versions</div>
                        <div className="text-sm text-muted-foreground">
                            Prompt: {r.prompt_version ?? "—"} · Schema: {r.schema_version ?? "—"} · Model:{" "}
                            {r.model ?? "—"}
                        </div>
                    </div>
                </div>

                {r.summary ? (
                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Summary</div>
                        <div className="text-sm">{r.summary}</div>
                    </div>
                ) : null}

                {r.error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <div className="text-sm font-semibold text-destructive">Run Error</div>
                        <div className="mt-1 text-sm text-destructive">
                            {r.error_stage ? <span className="font-medium">Stage:</span> : null}{" "}
                            {r.error_stage ?? ""}
                        </div>
                        <div className="mt-1 text-sm">{r.error}</div>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${r.user_id}`}>Open User</Link>
                    </Button>

                    <form action={replayRun}>
                        <Button type="submit" size="sm" variant="outline">
                            Replay (new run)
                        </Button>
                    </form>
                </div>
            </div>

            {/* QA Panel */}
            <div className="rounded-lg border bg-background p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">QA Panel</h2>
                    <p className="text-sm text-muted-foreground">
                        Add notes/tags and flag runs that need prompt improvements.
                    </p>
                </div>

                <form action={updateQa} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
                        <textarea
                            name="admin_notes"
                            defaultValue={r.admin_notes ?? ""}
                            placeholder="What went wrong? What should the prompt do differently?"
                            className="min-h-[120px] w-full rounded-md border bg-transparent p-3 text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">QA Tags</label>
                        <input
                            name="qa_tags"
                            defaultValue={tagsToString(r.qa_tags)}
                            placeholder="e.g. vague-intake, missing-kpis, weak-roadmap"
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma-separated. Stored as <code>text[]</code>.
                        </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="needs_prompt_tuning"
                            defaultChecked={!!r.needs_prompt_tuning}
                        />
                        Needs prompt tuning
                    </label>

                    <div className="flex gap-2">
                        <Button type="submit" variant="default">
                            Save QA
                        </Button>
                        <Button asChild type="button" variant="outline">
                            <Link href={`/admin/runs/${id}`}>Reset</Link>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Intake */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold">Intake Submitted</h2>
                <div className="overflow-hidden rounded-lg border bg-background">
                    <pre className="max-h-[520px] overflow-auto p-3 text-xs">{prettyJson(r.intake)}</pre>
                </div>
            </div>

            {/* Result (Rendered) */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold">Audit Result (Rendered)</h2>
                <AuditResultRenderer result={r.result} />
            </div>

            {/* Result (Raw JSON) */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold">Audit Result (Raw JSON)</h2>
                <div className="overflow-hidden rounded-lg border bg-background">
                    <pre className="max-h-[520px] overflow-auto p-3 text-xs">{prettyJson(r.result)}</pre>
                </div>
            </div>
        </div>
    );
}

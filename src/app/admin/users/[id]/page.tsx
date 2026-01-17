import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type Params = { id: string };

type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
    business_description: string | null;
    onboarding_completed: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type RoleRow = {
    user_id: string;
    role: string;
    created_at: string | null;
};

type RunRow = {
    id: string;
    status: string | null;
    created_at: string | null;
    analyzed_at: string | null;
    updated_at: string | null;
    summary: string | null;
    error: string | null;
    error_stage: string | null;
};

function fmt(dt: string | null) {
    if (!dt) return "—";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    // 1) Load profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
            "id,email,full_name,business_name,phone,business_description,onboarding_completed,created_at,updated_at"
        )

        .eq("id", id)
        .maybeSingle();

    if (profileError) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">User</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Back</Link>
                    </Button>
                </div>
                <p className="text-sm text-destructive">
                    Failed to load user profile: {profileError.message}
                </p>
            </div>
        );
    }

    if (!profile) {
        notFound();
    }

    const p = profile as ProfileRow;

    // 2) Load roles
    const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id,role,created_at")
        .eq("user_id", id);

    const roleList: RoleRow[] = (roles ?? []) as RoleRow[];
    const roleLabel = roleList.length ? roleList.map((r) => r.role).join(", ") : "—";

    // 3) Load runs for this user
    const { data: runs, error: runsError } = await supabase
        .from("audit_runs")
        .select("id,status,created_at,updated_at,analyzed_at,summary,error,error_stage")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    const runRows: RunRow[] = (runs ?? []) as RunRow[];

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">User Detail</h1>
                    <p className="text-sm text-muted-foreground">
                        Profile, roles, and audit runs for this user.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Back to Users</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin">Admin Home</Link>
                    </Button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Email</div>
                        <div className="text-sm">{p.email ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Role</div>
                        <div className="text-sm">
                            <span
                                className={
                                    roleLabel.includes("admin")
                                        ? "rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary"
                                        : "rounded-md bg-muted px-2 py-0.5 font-medium text-foreground"
                                }
                            >
                                {roleLabel}
                            </span>
                            {rolesError ? (
                                <div className="mt-1 text-xs text-destructive">
                                    Roles load failed: {rolesError.message}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Full Name</div>
                        <div className="text-sm">{p.full_name ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Business Name</div>
                        <div className="text-sm">{p.business_name ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Phone</div>
                        <div className="text-sm">{p.phone ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Onboarding</div>
                        <div className="text-sm">
                            {p.onboarding_completed ? (
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                                    Complete
                                </span>
                            ) : (
                                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                    Incomplete
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Created</div>
                        <div className="text-sm text-muted-foreground">{fmt(p.created_at)}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Updated</div>
                        <div className="text-sm text-muted-foreground">{fmt(p.updated_at)}</div>
                    </div>

                    <div className="sm:col-span-2">
                        <div className="text-xs font-medium text-muted-foreground">Business Description</div>
                        <div className="text-sm whitespace-pre-wrap">
                            {p.business_description ?? "—"}

                        </div>
                    </div>
                </div>
            </div>

            {/* Runs */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Audit Runs</h2>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/runs">View All Runs</Link>
                    </Button>
                </div>

                {runsError ? (
                    <div className="rounded-lg border bg-background p-4 text-sm text-destructive">
                        Failed to load runs: {runsError.message}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-background">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                        <th>Run</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Analyzed</th>
                                        <th>Summary</th>
                                        <th className="w-[1%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {runRows.length === 0 ? (
                                        <tr>
                                            <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                                                No audit runs for this user yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        runRows.map((r) => (
                                            <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                                <td className="whitespace-nowrap font-mono text-xs">
                                                    {r.id.slice(0, 8)}…
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    {r.status ?? <span className="text-muted-foreground">—</span>}
                                                    {r.error ? (
                                                        <div className="mt-1 text-xs text-destructive">
                                                            Error{r.error_stage ? ` (${r.error_stage})` : ""}:{" "}
                                                            {r.error}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="whitespace-nowrap text-muted-foreground">
                                                    {fmt(r.created_at)}
                                                </td>
                                                <td className="whitespace-nowrap text-muted-foreground">
                                                    {fmt(r.analyzed_at)}
                                                </td>
                                                <td className="max-w-[420px] truncate text-muted-foreground">
                                                    {r.summary ?? "—"}
                                                </td>
                                                <td className="text-right">
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={`/admin/runs/${r.id}`}>Open</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Next: we’ll build <code>/admin/runs</code> and <code>/admin/runs/[id]</code> to inspect intake + results.
            </p>
        </div>
    );
}

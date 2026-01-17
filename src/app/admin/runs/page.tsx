import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type RunRow = {
    id: string;
    user_id: string;
    status: string | null;
    created_at: string | null;
    analyzed_at: string | null;
    updated_at: string | null;
    summary: string | null;
    error: string | null;
    error_stage: string | null;
};

type ProfileMini = {
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
};

function fmt(dt: string | null) {
    if (!dt) return "—";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

export default async function AdminRunsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const { q, status } = await searchParams;

    const supabase = await createClient();

    // 1) If searching by client info, find matching user_ids via profiles first
    let filteredUserIds: string[] | null = null;

    const queryText = (q ?? "").trim();
    if (queryText.length > 0) {
        const { data: matchedProfiles, error: matchErr } = await supabase
            .from("profiles")
            .select("id")
            .or(
                [
                    `email.ilike.%${queryText}%`,
                    `full_name.ilike.%${queryText}%`,
                    `business_name.ilike.%${queryText}%`,
                ].join(",")
            );

        if (matchErr) {
            return (
                <div className="mx-auto w-full max-w-6xl space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-primary">Audit Runs</h1>
                        <Button asChild variant="outline">
                            <Link href="/admin">Back</Link>
                        </Button>
                    </div>
                    <p className="text-sm text-destructive">
                        Search failed: {matchErr.message}
                    </p>
                </div>
            );
        }

        filteredUserIds = (matchedProfiles ?? []).map((p: any) => p.id);

        // If no matching users, return empty state early (saves DB work)
        if (filteredUserIds.length === 0) {
            return (
                <div className="mx-auto w-full max-w-6xl space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold text-primary">Audit Runs</h1>
                            <p className="text-sm text-muted-foreground">
                                No clients matched “{queryText}”.
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/admin">Admin Home</Link>
                        </Button>
                    </div>

                    <FilterBar q={q ?? ""} status={status ?? ""} />

                    <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                        Try a different search term (email, name, or business name).
                    </div>
                </div>
            );
        }
    }

    // 2) Fetch runs with filters
    let runsQuery = supabase
        .from("audit_runs")
        .select("id,user_id,status,created_at,updated_at,analyzed_at,summary,error,error_stage")
        .order("created_at", { ascending: false });

    if (filteredUserIds) {
        runsQuery = runsQuery.in("user_id", filteredUserIds);
    }

    const statusFilter = (status ?? "").trim();
    if (statusFilter.length > 0 && statusFilter !== "all") {
        runsQuery = runsQuery.eq("status", statusFilter);
    }

    const { data: runs, error: runsError } = await runsQuery;

    if (runsError) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">Audit Runs</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin">Back</Link>
                    </Button>
                </div>
                <p className="text-sm text-destructive">Failed to load runs: {runsError.message}</p>
            </div>
        );
    }

    const runRows: RunRow[] = (runs ?? []) as RunRow[];
    const userIds = Array.from(new Set(runRows.map((r) => r.user_id)));

    // 3) Join profiles in server code (base table)
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id,email,full_name,business_name")
        .in("id", userIds);

    const profileMap = new Map<string, ProfileMini>();
    if (profiles) {
        for (const p of profiles as any[]) {
            profileMap.set(p.id, p as ProfileMini);
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Audit Runs</h1>
                    <p className="text-sm text-muted-foreground">
                        Filter by client or status. Click a run to inspect intake + results.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin">Admin Home</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Users</Link>
                    </Button>
                </div>
            </div>

            <FilterBar q={q ?? ""} status={status ?? ""} />

            <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Run</th>
                                <th>Client</th>
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
                                    <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                                        No runs match your filters.
                                    </td>
                                </tr>
                            ) : (
                                runRows.map((r) => {
                                    const p = profileMap.get(r.user_id);
                                    const clientLabel =
                                        p?.email ?? p?.full_name ?? p?.business_name ?? `${r.user_id.slice(0, 8)}…`;

                                    return (
                                        <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                            <td className="whitespace-nowrap font-mono text-xs">{r.id.slice(0, 8)}…</td>
                                            <td className="max-w-[260px] truncate">
                                                <div className="font-medium">{clientLabel}</div>
                                                {p?.business_name ? (
                                                    <div className="text-xs text-muted-foreground">{p.business_name}</div>
                                                ) : null}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                                    {r.status ?? "—"}
                                                </span>
                                                {r.error ? (
                                                    <div className="mt-1 text-xs text-destructive">
                                                        Error{r.error_stage ? ` (${r.error_stage})` : ""}: {r.error}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="whitespace-nowrap text-muted-foreground">{fmt(r.created_at)}</td>
                                            <td className="whitespace-nowrap text-muted-foreground">{fmt(r.analyzed_at)}</td>
                                            <td className="max-w-[420px] truncate text-muted-foreground">{r.summary ?? "—"}</td>
                                            <td className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/runs/${r.id}`}>Open</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function FilterBar({ q, status }: { q: string; status: string }) {
    return (
        <form className="rounded-lg border bg-background p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Search</label>
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Email, name, or business name…"
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                    />
                </div>

                <div className="w-full space-y-1 sm:w-56">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <select
                        name="status"
                        defaultValue={status || "all"}
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="submitted">submitted</option>
                        <option value="analyzed">analyzed</option>
                        <option value="failed">failed</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" variant="default">
                        Apply
                    </Button>

                    <Button asChild type="button" variant="outline">
                        <Link href="/admin/runs">Reset</Link>
                    </Button>
                </div>
            </div>
        </form>
    );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyzeRunButton } from "@/components/audit/analyze-run-button";

type RunRow = {
    id: string;
    created_at: string;
    status: string;
    summary: string | null;
    error: string | null;
};

function StatusPill({ status }: { status: string }) {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border";
    const map: Record<string, string> = {
        submitted: "bg-muted/30 text-foreground",
        analyzing: "bg-muted/30 text-foreground",
        analyzed: "bg-muted/30 text-foreground",
        error: "bg-destructive/10 text-destructive border-destructive/30",
    };

    return <span className={`${base} ${map[status] ?? "bg-muted/30 text-foreground"}`}>{status}</span>;
}

export default async function RunsPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
        redirect("/");
    }

    const { data: runs, error } = await supabase
        .from("audit_runs")
        .select("id,created_at,status,summary,error")
        .eq("user_id", auth.user.id)
        .in("status", ["submitted", "analyzing", "analyzed", "error"])
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        return (
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-medium text-destructive">Failed to load runs</div>
                <div className="mt-2 text-sm text-muted-foreground">{error.message}</div>
            </div>
        );
    }

    const safeRuns: RunRow[] = runs ?? [];

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold text-primary">Runs</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Submitted audits live here. Trigger analysis and view results.
                </p>
            </div>

            {safeRuns.length === 0 ? (
                <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                    No submitted audits yet. Go to <span className="font-medium text-foreground">Run an Audit</span> to submit intake.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border bg-background">
                    <div className="grid grid-cols-[1fr_140px_280px] gap-0 border-b bg-muted/20 px-4 py-2 text-xs font-medium">
                        <div>Run</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    <div className="divide-y">
                        {safeRuns.map((run) => {
                            const created = new Date(run.created_at).toLocaleString();

                            return (
                                <div key={run.id} className="grid grid-cols-[1fr_140px_280px] items-center px-4 py-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{run.id}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Created: {created}</div>

                                        {run.summary ? (
                                            <div className="mt-2 text-xs text-muted-foreground">{run.summary}</div>
                                        ) : null}

                                        {run.status === "error" && run.error ? (
                                            <div className="mt-2 text-xs text-destructive">{run.error}</div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <StatusPill status={run.status} />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        {run.status === "submitted" ? <AnalyzeRunButton runId={run.id} /> : null}
                                        {run.status === "analyzing" ? (
                                            <div className="text-sm text-muted-foreground">Analyzing…</div>
                                        ) : null}
                                        {run.status === "analyzed" ? (
                                            <a className="text-sm underline" href="/dashboard/reports">
                                                View report
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

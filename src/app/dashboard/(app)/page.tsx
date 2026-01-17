import { createClient } from "@/lib/supabase/server";
import { AuditRunPanel } from "@/components/audit/audit-run-panel";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    let run: {
        id: string;
        status: string;
        summary: string | null;
        result: any | null;
        error: string | null;
    } | null = null;

    if (auth.user) {
        const { data } = await supabase
            .from("audit_runs")
            .select("id,status,summary,result,error,created_at")
            .eq("user_id", auth.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        run = data ?? null;
    }

    return (
        <div className="space-y-4">
            {/* Intro */}
            <div>
                <h1 className="text-xl font-semibold text-primary">
                    Welcome to your audit dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Run audits, review findings, and generate reports.
                </p>
            </div>

            {/* Process outline (MUST be inside return) */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-medium">How the audit works</div>

                <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li>
                        <span className="font-medium text-foreground">1) Intake</span>
                        <div className="mt-1">
                            You answer structured questions about how requests enter your
                            business, who touches the work, what tools are used, where handoffs
                            happen, and what feels manual or error-prone.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">2) AI analysis</span>
                        <div className="mt-1">
                            The system maps your workflow, detects bottlenecks, and identifies
                            automation opportunities across intake quality, duplication,
                            repetitive communication, knowledge reuse, and risk.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">3) Findings</span>
                        <div className="mt-1">
                            You get prioritized recommendations with impact, effort, and quick
                            wins. Assumptions are listed explicitly so the output stays
                            audit-ready.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">4) Report</span>
                        <div className="mt-1">
                            When results are ready, you can export a PDF and email it to
                            yourself or stakeholders from the Reports page.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">5) Next actions</span>
                        <div className="mt-1">
                            Use the output to generate an implementation plan, trigger
                            automations, or hand it to Kalibri for build-out (Phase 2).
                        </div>
                    </li>
                </ol>
            </div>

            {/* Current run (temporary) */}
            {run ? (
                <AuditRunPanel auditRunId={run.id} status={run.status} />
            ) : (
                <div className="text-sm text-muted-foreground">No audit run yet.</div>
            )}
        </div>
    );
}

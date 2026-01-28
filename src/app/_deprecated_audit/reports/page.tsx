import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

type AuditResult = {
    business_summary?: { one_liner?: string; description?: string };
    assumptions?: string[];
    findings?: Array<{
        dimension?: string;
        what_we_observed?: string;
        why_it_matters?: string;
        evidence_from_intake?: string[];
        risk_level?: "low" | "medium" | "high" | string;
    }>;
    recommendations?: Array<{
        title?: string;
        impact?: "low" | "medium" | "high" | string;
        effort?: "low" | "medium" | "high" | string;
        why?: string;
        steps?: string[];
        tools_or_assets?: string[];
    }>;
};

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: run, error } = await supabase
        .from("audit_runs")
        .select("id,status,summary,result,created_at,error")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        return (
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-medium text-destructive">Failed to load report</div>
                <div className="mt-2 text-sm text-muted-foreground">{error.message}</div>
            </div>
        );
    }

    const canExport = run?.status === "analyzed";
    const result: AuditResult | null = (run?.result as any) ?? null;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold text-primary">Reports</h1>
                <p className="mt-1 text-sm text-muted-foreground">Review, export, and share your audit results.</p>
            </div>

            {/* Latest audit + export controls */}
            <div className="rounded-lg border bg-background p-4 space-y-3">
                <div className="text-sm font-medium">Latest audit</div>

                {run ? (
                    <div className="text-sm text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{run.status}</span>
                        {run.summary ? <div className="mt-2 text-xs">{run.summary}</div> : null}
                        {run.status === "error" && run.error ? (
                            <div className="mt-2 text-xs text-destructive">{run.error}</div>
                        ) : null}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">No audit run found yet.</div>
                )}

                {/* ✅ Wired buttons */}
                {run ? <ReportExportButtons runId={run.id} disabled={!canExport} /> : null}

                {!canExport ? (
                    <div className="text-xs text-muted-foreground">Export options unlock after an audit is analyzed.</div>
                ) : null}
            </div>

            {/* Render analyzed results */}
            {run && run.status === "analyzed" && result ? (
                <div className="space-y-4">
                    {/* Jump row */}
                    <div className="flex flex-wrap gap-3 text-sm">
                        <a href="#recommendations" className="underline">
                            Recommendations
                        </a>
                        <a href="#assumptions" className="underline">
                            Assumptions
                        </a>
                        <a href="#findings" className="underline">
                            Findings (appendix)
                        </a>
                    </div>

                    {/* Business summary */}
                    <div className="rounded-lg border bg-background p-4 space-y-2">
                        <div className="text-sm font-medium">Business summary</div>
                        {result.business_summary?.one_liner ? (
                            <div className="text-sm font-semibold">{result.business_summary.one_liner}</div>
                        ) : null}
                        {result.business_summary?.description ? (
                            <div className="text-sm text-muted-foreground">{result.business_summary.description}</div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No summary provided.</div>
                        )}
                    </div>

                    {/* Recommendations FIRST */}
                    <div id="recommendations" className="rounded-lg border bg-background p-4 space-y-3">
                        <div className="text-sm font-medium">Recommendations</div>

                        {Array.isArray(result.recommendations) && result.recommendations.length > 0 ? (
                            <div className="space-y-3">
                                {result.recommendations.map((r, idx) => (
                                    <div key={idx} className="rounded-md border bg-muted/10 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm font-semibold">{r.title ?? "Recommendation"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {r.impact ? (
                                                    <>
                                                        Impact: <span className="font-medium text-foreground">{r.impact}</span>
                                                    </>
                                                ) : null}
                                                {r.effort ? (
                                                    <>
                                                        {" "}
                                                        • Effort: <span className="font-medium text-foreground">{r.effort}</span>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>

                                        {r.why ? (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">Why:</span> {r.why}
                                            </div>
                                        ) : null}

                                        {Array.isArray(r.steps) && r.steps.length > 0 ? (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <div className="font-medium text-foreground">Steps</div>
                                                <ol className="mt-1 list-decimal pl-5 space-y-1">
                                                    {r.steps.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        ) : null}

                                        {Array.isArray(r.tools_or_assets) && r.tools_or_assets.length > 0 ? (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                <div className="font-medium text-foreground">Tools / assets</div>
                                                <ul className="mt-1 list-disc pl-5 space-y-1">
                                                    {r.tools_or_assets.map((t, i) => (
                                                        <li key={i}>{t}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No recommendations provided.</div>
                        )}
                    </div>

                    {/* Assumptions SECOND */}
                    <div id="assumptions" className="rounded-lg border bg-background p-4 space-y-2">
                        <div className="text-sm font-medium">Assumptions</div>

                        {Array.isArray(result.assumptions) && result.assumptions.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {result.assumptions.map((a, i) => (
                                    <li key={i}>{a}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-muted-foreground">No assumptions listed.</div>
                        )}
                    </div>

                    {/* Findings LAST (Appendix) */}
                    <div id="findings" className="rounded-lg border bg-background p-4 space-y-3">
                        <div>
                            <h2 className="text-sm font-medium">This report was based on the following findings</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The recommendations above map directly to these observations from your intake.
                            </p>
                        </div>

                        {Array.isArray(result.findings) && result.findings.length > 0 ? (
                            <div className="space-y-3">
                                {result.findings.map((f, idx) => (
                                    <div key={idx} className="rounded-md border bg-muted/10 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm font-semibold">{f.dimension ?? "Finding"}</div>
                                            {f.risk_level ? (
                                                <div className="text-xs text-muted-foreground">
                                                    Risk: <span className="font-medium text-foreground">{f.risk_level}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {f.what_we_observed ? (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">Observed:</span> {f.what_we_observed}
                                            </div>
                                        ) : null}

                                        {f.why_it_matters ? (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">Why it matters:</span> {f.why_it_matters}
                                            </div>
                                        ) : null}

                                        {Array.isArray(f.evidence_from_intake) && f.evidence_from_intake.length > 0 ? (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                <div className="font-medium text-foreground">Evidence from intake</div>
                                                <ul className="mt-1 list-disc pl-5 space-y-1">
                                                    {f.evidence_from_intake.map((e, i) => (
                                                        <li key={i}>{e}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No findings provided.</div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

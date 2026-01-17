import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyzeRunButton } from "@/components/audit/analyze-run-button";

type Finding = {
  dimension?: string;
  what_we_observed?: string;
  why_it_matters?: string;
  evidence_from_intake?: string[];
  risk_level?: "low" | "medium" | "high" | string;
};

type AuditResult = {
  findings?: Finding[];
};

function statusText(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted — ready to analyze.";
    case "analyzing":
      return "Analyzing…";
    case "analyzed":
      return "Analysis complete.";
    case "error":
      return "Analysis failed.";
    default:
      return status;
  }
}

function safeResult(raw: unknown): AuditResult | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as AuditResult;
}

export default async function FindingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/");

  const { data: run, error } = await supabase
    .from("audit_runs")
    .select("id,status,summary,error,result,created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <div className="text-sm font-medium text-destructive">Failed to load findings</div>
        <div className="mt-2 text-sm text-muted-foreground">{error.message}</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-primary">Findings</h1>
        <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
          No audit submitted yet. Start with <span className="font-medium text-foreground">Run an Audit</span>.
        </div>
      </div>
    );
  }

  const result = safeResult(run.result);
  const findings = result?.findings ?? [];
  const canAnalyze = run.status === "submitted" || run.status === "error";
  const showFindings = run.status === "analyzed";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Findings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What we observed in your workflow and why it matters.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-4 space-y-3">
        <div className="text-sm font-medium">Latest audit</div>

        <div className="text-sm text-muted-foreground">{statusText(run.status)}</div>

        {run.summary ? (
          <div className="text-xs text-muted-foreground">{run.summary}</div>
        ) : null}

        {run.status === "error" && run.error ? (
          <div className="text-xs text-destructive">{run.error}</div>
        ) : null}

        {canAnalyze ? (
          <div className="flex flex-wrap gap-2">
            <AnalyzeRunButton runId={run.id} />
          </div>
        ) : null}

        {!showFindings ? (
          <div className="text-xs text-muted-foreground">
            Findings appear after analysis completes.
          </div>
        ) : null}
      </div>

      {showFindings ? (
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <div className="text-sm font-medium">Findings</div>

          {findings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No findings provided.</div>
          ) : (
            <div className="space-y-3">
              {findings.map((f, idx) => (
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
                      <div className="font-medium text-foreground">Evidence</div>
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
          )}
        </div>
      ) : null}
    </div>
  );
}

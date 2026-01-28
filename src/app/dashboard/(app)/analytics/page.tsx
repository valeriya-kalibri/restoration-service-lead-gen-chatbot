import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ range?: string; inquiry?: string }>;
};

type SessionRow = {
  id: string;
  created_at: string;
  last_step_id: string | null;
  outcome: string | null;
  inquiry_type: string | null;
};

function clampRange(raw: string | undefined) {
  if (raw === "7d") return { key: "7d", days: 7, label: "Last 7 days" };
  if (raw === "90d") return { key: "90d", days: 90, label: "Last 90 days" };
  return { key: "30d", days: 30, label: "Last 30 days" };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const range = clampRange(sp.range);

  const inquiry = (sp.inquiry ?? "all").toLowerCase();
  const allowedInquiry = new Set(["all", "water", "fire", "mold", "not_sure"]);
  const inquiryFilter = allowedInquiry.has(inquiry) ? inquiry : "all";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Please log in.</p>
      </div>
    );
  }

  const since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString();

  let q = supabase
    .from("chat_sessions")
    .select("id, created_at, last_step_id, outcome, inquiry_type")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (inquiryFilter !== "all") {
    q = q.eq("inquiry_type", inquiryFilter);
  }

  const { data, error } = await q.returns<SessionRow[]>();

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <div className="rounded-md border p-3 text-sm">Error loading analytics: {error.message}</div>
      </div>
    );
  }

  const sessions = Array.isArray(data) ? data : [];
  const total = sessions.length;

  // ✅ New outcome buckets
  const callInitiated = sessions.filter((s) => s.outcome === "call_initiated").length;
  const callbackRequested = sessions.filter((s) => s.outcome === "callback_requested").length;
  const leadCaptured = sessions.filter((s) => s.outcome === "lead_captured").length;
  const abandoned = sessions.filter((s) => s.outcome === "abandoned").length;
  const unknown = sessions.filter((s) => !s.outcome || s.outcome === "unknown").length;

  // ✅ v1 conversion definition
  const conversions = callInitiated + callbackRequested;
  const conversionRate = total > 0 ? (conversions / total) * 100 : 0;

  // Drop-off stays the same
  const stepCounts = new Map<string, number>();
  for (const s of sessions) {
    const step = s.last_step_id ?? "unknown";
    stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
  }

  const topDropoff = Array.from(stepCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  function pct(n: number) {
    return total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";
  }

  const rangeLinks = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
  ];

  return (
    <div className="space-y-6">
      {/* Header + range selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
        <div className="space-y-3">
          <h1 className="text-lg font-semibold">Analytics</h1>

          <p className="text-sm font-bold text-primary mb-8">Track outcomes and where users drop off.</p>

          <p className="text-sm text-muted-foreground">
            {range.label}
            {inquiryFilter !== "all" ? ` • Inquiry: ${inquiryFilter.replace("_", " ")}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-9">
          {/* Range */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Range</div>
            <div className="flex overflow-hidden rounded-md border">
              {rangeLinks.map((r) => {
                const active = r.key === range.key;
                return (
                  <Link
                    key={r.key}
                    href={`/dashboard/analytics?range=${r.key}&inquiry=${inquiryFilter}`}
                    className={`px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                      }`}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Inquiry */}
          <div className="flex items-center gap-2 ml-6">
            <div className="text-xs text-muted-foreground">Inquiry</div>
            <div className="flex overflow-hidden rounded-md border">
              {[
                { key: "all", label: "All" },
                { key: "water", label: "Water" },
                { key: "fire", label: "Fire" },
                { key: "mold", label: "Mold" },
                { key: "not_sure", label: "Not sure" },
              ].map((opt) => {
                const active = opt.key === inquiryFilter;
                return (
                  <Link
                    key={opt.key}
                    href={`/dashboard/analytics?range=${range.key}&inquiry=${opt.key}`}
                    className={`px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                      }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Total sessions</div>
          <div className="mt-1 text-2xl font-semibold">{total}</div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Conversions</div>
          <div className="mt-1 text-2xl font-semibold">{conversions}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {conversionRate.toFixed(1)}% call initiated or callback requested
          </div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Call initiated</div>
          <div className="mt-1 text-2xl font-semibold">{callInitiated}</div>
          <div className="mt-1 text-xs text-muted-foreground">{pct(callInitiated)}%</div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Callback requested</div>
          <div className="mt-1 text-2xl font-semibold">{callbackRequested}</div>
          <div className="mt-1 text-xs text-muted-foreground">{pct(callbackRequested)}%</div>
        </div>
      </div>

      {/* Outcome breakdown */}
      <div className="rounded-md border p-4">
        <div className="text-sm font-semibold">Outcome breakdown</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Call initiated</div>
            <div className="mt-1 text-xl font-semibold">{callInitiated}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(callInitiated)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Callback requested</div>
            <div className="mt-1 text-xl font-semibold">{callbackRequested}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(callbackRequested)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Lead captured</div>
            <div className="mt-1 text-xl font-semibold">{leadCaptured}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(leadCaptured)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Abandoned</div>
            <div className="mt-1 text-xl font-semibold">{abandoned}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(abandoned)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Unknown</div>
            <div className="mt-1 text-xl font-semibold">{unknown}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(unknown)}%</div>
          </div>
        </div>
      </div>

      {/* Drop-off */}
      <div className="rounded-md border p-4">
        <div className="text-sm font-semibold">Top drop-off steps</div>
        <div className="mt-1 text-xs text-muted-foreground">Based on the last recorded step for each session.</div>

        {total === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No sessions yet.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {topDropoff.map(([step, count]) => {
              const p = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={step} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{step}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} sessions ({p.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="h-2 w-44 overflow-hidden rounded bg-muted">
                    <div className="h-2 bg-primary" style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStepLabel } from "@/lib/chat/step-labels";

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

type EventRow = {
  event_type: string;
  created_at: string;
  session_id: string | null;
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

  let sessionsQuery = supabase
    .from("chat_sessions")
    .select("id, created_at, last_step_id, outcome, inquiry_type")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (inquiryFilter !== "all") {
    sessionsQuery = sessionsQuery.eq("inquiry_type", inquiryFilter);
  }

  const { data: sessionsData, error: sessionsError } = await sessionsQuery.returns<SessionRow[]>();

  if (sessionsError) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <div className="rounded-md border p-3 text-sm">
          Error loading analytics: {sessionsError.message}
        </div>
      </div>
    );
  }

  const sessions = Array.isArray(sessionsData) ? sessionsData : [];
  const total = sessions.length;

  const sessionIds = new Set(sessions.map((s) => s.id));

  const { data: eventsData, error: eventsError } = await supabase
    .from("chat_events")
    .select("event_type, created_at, session_id")
    .gte("created_at", since)
    .returns<EventRow[]>();

  if (eventsError) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <div className="rounded-md border p-3 text-sm">
          Error loading analytics events: {eventsError.message}
        </div>
      </div>
    );
  }

  const events = Array.isArray(eventsData) ? eventsData : [];

  const callInitiated = sessions.filter((s) => s.outcome === "call_initiated").length;
  const callbackRequested = sessions.filter((s) => s.outcome === "callback_requested").length;
  const leadCaptured = sessions.filter((s) => s.outcome === "lead_captured").length;
  const abandoned = sessions.filter((s) => s.outcome === "abandoned").length;
  const unknown = sessions.filter((s) => !s.outcome || s.outcome === "unknown").length;

  const smsSessionIds = new Set(
    events
      .filter((e) => e.event_type === "text_initiated" && !!e.session_id && sessionIds.has(e.session_id))
      .map((e) => e.session_id as string)
  );
  const smsClicked = smsSessionIds.size;

  const conversions = leadCaptured;
  const conversionRate = total > 0 ? (conversions / total) * 100 : 0;

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
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
        <div className="space-y-3">
          <h1 className="text-lg font-semibold">Analytics</h1>

          <p className="mb-8 text-sm font-bold text-primary">
            TRACK OUTCOMES AND USER DROP OFF POINTS
          </p>

          <p className="text-sm text-muted-foreground">
            Conversion rate represents the percentage of visitors who submitted their contact information and became a lead.
          </p>

          <p className="text-sm text-muted-foreground">
            {range.label}
            {inquiryFilter !== "all" ? ` • Inquiry: ${inquiryFilter.replace("_", " ")}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-9">
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

          <div className="ml-6 flex items-center gap-2">
            <div className="text-xs text-foreground">Inquiry</div>
            <div className="flex overflow-hidden rounded-md border">
              {[
                { key: "all", label: "All" },
                { key: "water", label: "WATER" },
                { key: "fire", label: "FIRE" },
                { key: "mold", label: "MOLD" },
                { key: "not_sure", label: "NOT SURE" },
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="text-sm font-bold text-primary">Total Sessions</div>
          <div className="mt-1 text-3xl font-bold text-primary">{total}</div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-sm font-semibold text-primary">Conversions</div>
          <div className="mt-1 text-3xl font-bold text-primary">{conversions}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Lead contact information submitted
          </div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-sm font-semibold text-primary">Conversion Rate</div>
          <div className="mt-1 text-3xl font-bold text-primary">
            {conversionRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Of total sessions</div>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="text-base font-bold text-primary tracking-tight">
          Outcome Breakdown
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">Call Initiated</div>
            <div className="mt-1 text-xl font-semibold">{callInitiated}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(callInitiated)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">Callback Requested</div>
            <div className="mt-1 text-xl font-semibold">{callbackRequested}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(callbackRequested)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">SMS Clicked</div>
            <div className="mt-1 text-xl font-semibold">{smsClicked}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(smsClicked)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">Lead Captured</div>
            <div className="mt-1 text-xl font-semibold">{leadCaptured}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(leadCaptured)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">Abandoned</div>
            <div className="mt-1 text-xl font-semibold">{abandoned}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(abandoned)}%</div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground leading-tight h-8">Unknown</div>
            <div className="mt-1 text-xl font-semibold">{unknown}</div>
            <div className="mt-1 text-xs text-muted-foreground">{pct(unknown)}%</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="text-base font-bold text-primary tracking-tight">
          Where conversation stopped
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Last question users answered before leaving
        </div>

        {total === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No sessions yet.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {topDropoff.map(([step, count]) => {
              const p = total > 0 ? (count / total) * 100 : 0;
              const label = getStepLabel(step);

              return (
                <div key={step} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="space-y-1">
                      <div className="truncate text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {count} visitor{count !== 1 ? "s" : ""} stopped here ({p.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="h-2 w-44 overflow-hidden rounded bg-muted">
                    <div
                      className="h-2 bg-primary"
                      style={{ width: `${Math.min(100, p)}%` }}
                    />
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
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStepLabel } from "@/lib/chat/step-labels";
import { AnalyticsExplainer } from "./_components/analytics-explainer";
import {
    BarChart3, Users, TrendingUp, Phone, MessageSquare,
    PhoneCall, Zap, HelpCircle, UserX,
} from "lucide-react";

type PageProps = {
    searchParams?: Promise<{ range?: string; inquiry?: string }>;
};


function clampRange(raw: string | undefined) {
    if (raw === "7d") return { key: "7d", days: 7, label: "Last 7 days" };
    if (raw === "90d") return { key: "90d", days: 90, label: "Last 90 days" };
    return { key: "30d", days: 30, label: "Last 30 days" };
}

const RANGES = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
];

const INQUIRY_OPTS = [
    { key: "all", label: "All" },
    { key: "water", label: "Water" },
    { key: "fire", label: "Fire" },
    { key: "mold", label: "Mold" },
    { key: "not_sure", label: "Not sure" },
];

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
        .select("id, created_at, last_step_id, inquiry_type, lead_status, action_outcome")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);

    if (inquiryFilter !== "all") {
        sessionsQuery = sessionsQuery.eq("inquiry_type", inquiryFilter);
    }

    const { data, error } = await sessionsQuery;

    if (error) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Analytics</h1>
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Error loading analytics: {error.message}
                </div>
            </div>
        );
    }

    const sessions = Array.isArray(data) ? data : [];
    const total = sessions.length;

    const leadCaptured = sessions.filter((s) => s.lead_status === "lead_captured").length;
    const leadNotCaptured = sessions.filter((s) => s.lead_status === "lead_not_captured").length;
    const callInitiated = sessions.filter((s) => s.action_outcome === "call_initiated").length;
    const callbackRequested = sessions.filter((s) => s.action_outcome === "callback_requested").length;
    const smsInitiated = sessions.filter((s) => s.action_outcome === "sms_initiated").length;
    const unknown = sessions.filter((s) => !s.action_outcome || s.action_outcome === "unknown").length;
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

    const outcomeCards = [
        { label: "Call Initiated", value: callInitiated, icon: PhoneCall, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
        { label: "Callback Requested", value: callbackRequested, icon: Phone, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        { label: "SMS Initiated", value: smsInitiated, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        { label: "Lead Captured", value: leadCaptured, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        { label: "Lead Not Captured", value: leadNotCaptured, icon: UserX, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
        { label: "Unknown", value: unknown, icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border" },
    ];

    return (
        <div className="space-y-5">
            {/* Header banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Performance
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="mt-1 text-sm text-white/70">
                        {range.label}{inquiryFilter !== "all" ? ` · ${inquiryFilter.replace("_", " ")}` : ""} — track outcomes and drop-off points.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <BarChart3 className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Explainer */}
            <AnalyticsExplainer />

            {/* Filters */}
            <div className="rounded-xl border bg-indigo-50 px-4 py-3 flex flex-wrap gap-6">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Range</p>
                    <div className="flex gap-1.5">
                        {RANGES.map((r) => (
                            <Link
                                key={r.key}
                                href={`/dashboard/analytics?range=${r.key}&inquiry=${inquiryFilter}`}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    r.key === range.key
                                        ? "border-primary bg-primary text-white"
                                        : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                {r.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Damage type</p>
                    <div className="flex flex-wrap gap-1.5">
                        {INQUIRY_OPTS.map((opt) => (
                            <Link
                                key={opt.key}
                                href={`/dashboard/analytics?range=${range.key}&inquiry=${opt.key}`}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    opt.key === inquiryFilter
                                        ? "border-primary bg-primary text-white"
                                        : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border-2 border-primary/20 bg-indigo-50 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold uppercase tracking-wider text-primary/80">Total Sessions</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="text-4xl font-semibold text-primary text-center">{total}</div>
                    <div className="text-xs text-muted-foreground">Conversations started</div>
                </div>

                <div className="rounded-xl border-2 border-primary/20 bg-indigo-50 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold uppercase tracking-wider text-primary/80">Conversions</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Zap className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="text-4xl font-semibold text-primary text-center">{conversions}</div>
                    <div className="text-xs text-muted-foreground">Lead contact info submitted</div>
                </div>

                <div className="rounded-xl border-2 border-primary/20 bg-indigo-50 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold uppercase tracking-wider text-primary/80">Conversion Rate</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="text-4xl font-semibold text-primary text-center">{conversionRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Of total sessions</div>
                </div>
            </div>

            {/* Outcome breakdown */}
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-foreground">Outcome breakdown</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">How conversations ended across all sessions.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {outcomeCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div key={label} className={`rounded-xl border ${border} ${bg} p-3 space-y-2`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                            <div className="text-xl font-bold text-foreground">{value}</div>
                            <div className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</div>
                            <div className={`text-xs font-semibold ${color}`}>{pct(value)}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drop-off */}
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-foreground">Where you&apos;re losing leads</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Last question visitors answered before leaving.</p>
                </div>

                {total === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                    <div className="space-y-3">
                        {topDropoff.map(([step, count]) => {
                            const p = total > 0 ? (count / total) * 100 : 0;
                            const label = getStepLabel(step);
                            return (
                                <div key={step} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm font-medium text-foreground truncate">{label}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {count} visitor{count !== 1 ? "s" : ""} · {p.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-50">
                                        <div
                                            className="h-2 rounded-full bg-primary"
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
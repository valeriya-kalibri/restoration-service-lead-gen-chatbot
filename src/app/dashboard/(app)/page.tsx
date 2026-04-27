import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Users, Zap, TrendingUp, ArrowRight, Droplets, Flame, Wind, HelpCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { SystemExplainer } from "./_components/system-explainer";

const quickLinks = [
    {
        href: "/dashboard/chat",
        label: "View Chat Logs",
        desc: "Browse every conversation and see where visitors dropped off.",
    },
    {
        href: "/dashboard/leads",
        label: "Manage Leads",
        desc: "See captured contact details, urgency level, and damage type.",
    },
    {
        href: "/dashboard/analytics",
        label: "Analytics",
        desc: "Spot trends by issue type, time of day, and conversion rate.",
    },
    {
        href: "/dashboard/settings",
        label: "Settings",
        desc: "Update your contact info, SMS number, and notification preferences.",
    },
];

function inquiryBadge(v: string | null) {
    switch (v) {
        case "water":    return { label: "Water",    className: "bg-blue-50 text-blue-700 border-blue-200",     icon: Droplets };
        case "fire":     return { label: "Fire",     className: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame };
        case "mold":     return { label: "Mold",     className: "bg-green-50 text-green-700 border-green-200",   icon: Wind };
        default:         return { label: v ? v.replace(/_/g, " ") : "Unknown", className: "bg-muted text-muted-foreground border-border", icon: HelpCircle };
    }
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    type SessionRow = {
        id: string;
        created_at: string;
        inquiry_type: string | null;
        lead_status: string | null;
        lead_name: string | null;
        action_outcome: string | null;
        follow_up_status: string | null;
    };

    let todaySessions = 0;
    let todayLeads = 0;
    let weekLeads = 0;
    let allSessions = 0;
    let allLeads = 0;
    let recentSessions: SessionRow[] = [];
    let needsFollowUp: SessionRow[] = [];
    let followedUpCount = 0;

    if (userId) {
        const [todayRes, weekRes, allRes, recentRes, followUpRes] = await Promise.all([
            supabase
                .from("chat_sessions")
                .select("id, lead_status")
                .eq("client_id", userId)
                .gte("created_at", todayIso),
            supabase
                .from("chat_sessions")
                .select("id, lead_status")
                .eq("client_id", userId)
                .gte("created_at", weekAgo),
            supabase
                .from("chat_sessions")
                .select("id, lead_status")
                .eq("client_id", userId),
            supabase
                .from("chat_sessions")
                .select("id, created_at, inquiry_type, lead_status, lead_name, action_outcome, follow_up_status")
                .eq("client_id", userId)
                .order("created_at", { ascending: false })
                .limit(5),
            supabase
                .from("chat_sessions")
                .select("id, created_at, inquiry_type, lead_status, lead_name, action_outcome, follow_up_status")
                .eq("client_id", userId)
                .eq("lead_status", "lead_captured")
                .order("created_at", { ascending: false })
                .limit(50),
        ]);

        const todayData = todayRes.data ?? [];
        todaySessions = todayData.length;
        todayLeads = todayData.filter(s => s.lead_status === "lead_captured").length;

        weekLeads = (weekRes.data ?? []).filter(s => s.lead_status === "lead_captured").length;

        const allData = allRes.data ?? [];
        allSessions = allData.length;
        allLeads = allData.filter(s => s.lead_status === "lead_captured").length;

        recentSessions = (recentRes.data ?? []) as SessionRow[];

        const allLeadSessions = (followUpRes.data ?? []) as SessionRow[];
        needsFollowUp = allLeadSessions.filter(
            s => !s.follow_up_status || s.follow_up_status === "new"
        );
        followedUpCount = allLeadSessions.filter(
            s => s.follow_up_status && s.follow_up_status !== "new"
        ).length;
    }

    const conversionRate = allSessions > 0 ? ((allLeads / allSessions) * 100).toFixed(1) : "—";

    const statCards = [
        { label: "Today's Leads",    value: String(todayLeads),    icon: Zap,           note: "Captured today" },
        { label: "Today's Sessions", value: String(todaySessions), icon: MessageSquare, note: "Conversations started today" },
        { label: "New This Week",    value: String(weekLeads),     icon: Users,         note: "Leads in last 7 days" },
        { label: "Conversion Rate",  value: conversionRate === "—" ? "—" : `${conversionRate}%`, icon: TrendingUp, note: "All-time leads / sessions" },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white">
                <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                    Kalibri AI Lead Capture
                </p>
                <h1 className="text-2xl font-bold tracking-tight">
                    Welcome to your Dashboard
                </h1>
                <p className="mt-1 text-sm text-white/70">
                    Monitor conversations, leads, and performance — all in one place.
                </p>
            </div>

            {/* How the system works */}
            <SystemExplainer />

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon, note }) => (
                    <div key={label} className="rounded-xl border-2 border-primary/20 bg-indigo-50 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary/80">{label}</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                        </div>
                        <div className="text-3xl font-semibold text-primary text-center">{value}</div>
                        <div className="text-xs text-muted-foreground">{note}</div>
                    </div>
                ))}
            </div>

            {/* Follow-up tracker */}
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-foreground">Follow-up Status</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Captured leads and where they stand.</p>
                    </div>
                    <Link href="/dashboard/leads" className="text-xs font-semibold text-primary hover:underline">
                        View all
                    </Link>
                </div>

                {/* Summary strip */}
                <div className="flex gap-3">
                    <div className="flex-1 rounded-xl border-2 border-orange-200 bg-orange-50 px-4 py-3 text-center space-y-0.5">
                        <div className="text-2xl font-bold text-orange-600">{needsFollowUp.length}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">Need follow-up</div>
                    </div>
                    <div className="flex-1 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center space-y-0.5">
                        <div className="text-2xl font-bold text-emerald-600">{followedUpCount}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Followed up</div>
                    </div>
                </div>

                {/* Needs follow-up list */}
                {needsFollowUp.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-medium">All leads have been followed up.</p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" /> Needs attention
                        </p>
                        {needsFollowUp.slice(0, 8).map((s) => {
                            const inq = inquiryBadge(s.inquiry_type);
                            const InqIcon = inq.icon;
                            return (
                                <Link
                                    key={s.id}
                                    href={`/dashboard/chat/${s.id}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 hover:border-orange-200 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 uppercase">
                                            {s.lead_name ? s.lead_name.charAt(0) : "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-foreground truncate">
                                                {s.lead_name ?? "Unknown visitor"}
                                            </div>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${inq.className}`}>
                                                <InqIcon className="h-2.5 w-2.5" />{inq.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] text-muted-foreground">{timeAgo(s.created_at)}</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                </Link>
                            );
                        })}
                        {needsFollowUp.length > 8 && (
                            <Link href="/dashboard/leads" className="block text-center text-xs font-semibold text-primary hover:underline pt-1">
                                +{needsFollowUp.length - 8} more — view all leads
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Last 5 conversations across all channels.</p>
                    </div>
                    <Link
                        href="/dashboard/chat"
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        View all
                    </Link>
                </div>

                {recentSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No activity yet. Once your chatbot goes live, conversations will appear here.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {recentSessions.map((s) => {
                            const inq = inquiryBadge(s.inquiry_type);
                            const InqIcon = inq.icon;
                            const captured = s.lead_status === "lead_captured";
                            return (
                                <Link
                                    key={s.id}
                                    href={`/dashboard/chat/${s.id}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border bg-indigo-50 px-4 py-3 hover:border-primary/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary uppercase">
                                            {s.lead_name ? s.lead_name.charAt(0) : "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-foreground truncate">
                                                {s.lead_name ?? "Unknown visitor"}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${inq.className}`}>
                                                    <InqIcon className="h-2.5 w-2.5" />{inq.label}
                                                </span>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${captured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
                                                    {captured ? "Lead captured" : "Not captured"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] text-muted-foreground">{timeAgo(s.created_at)}</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">What you can do here</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {quickLinks.map(({ href, label, desc }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-start justify-between gap-3 rounded-xl border-2 border-primary/20 bg-indigo-50 p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
                        >
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {label}
                                </div>
                                <div className="text-xs text-muted-foreground">{desc}</div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
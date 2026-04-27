import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MessageSquare, ArrowRight, Droplets, Flame, Wind, HelpCircle } from "lucide-react";
import { ChatFilters } from "./_components/chat-filters";

type ChatSessionRow = {
    id: string;
    created_at: string;
    inquiry_type: string | null;
    lead_status: string | null;
    outcome: string | null;
    follow_up_status: string | null;
};

type BadgeStyle = { label: string; className: string };

function inquiryBadge(value: string | null): BadgeStyle & { icon: React.ElementType } {
    switch (value) {
        case "water": return { label: "Water", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Droplets };
        case "fire":  return { label: "Fire",  className: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame };
        case "mold":  return { label: "Mold",  className: "bg-green-50 text-green-700 border-green-200", icon: Wind };
        default:      return { label: value ? value.replace(/_/g, " ") : "Unknown", className: "bg-muted text-muted-foreground border-border", icon: HelpCircle };
    }
}

function outcomeBadge(value: string | null): BadgeStyle {
    switch (value) {
        case "lead_captured":      return { label: "Lead captured",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "callback_requested": return { label: "Callback requested", className: "bg-blue-50 text-blue-700 border-blue-200" };
        case "call_initiated":     return { label: "Call initiated",     className: "bg-purple-50 text-purple-700 border-purple-200" };
        case "abandoned":          return { label: "Abandoned",          className: "bg-red-50 text-red-600 border-red-200" };
        default:                   return { label: value ? value.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border" };
    }
}

function followUpBadge(value: string | null): BadgeStyle {
    switch (value) {
        case "called":    return { label: "Called",    className: "border-purple-200 bg-purple-50 text-purple-700" };
        case "voicemail": return { label: "Voicemail", className: "border-orange-200 bg-orange-50 text-orange-700" };
        case "scheduled": return { label: "Scheduled", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
        case "closed":    return { label: "Closed",    className: "border-border bg-muted text-muted-foreground" };
        default:          return { label: "New",       className: "border-primary/40 bg-primary/10 text-primary" };
    }
}

function cardStyle(leadStatus: string | null, followUpStatus: string | null): string {
    if (leadStatus !== "lead_captured") {
        return "bg-white border-border";
    }
    const fu = followUpStatus ?? "new";
    if (fu === "closed")    return "bg-slate-100 border-slate-300";
    if (fu === "called" || fu === "voicemail" || fu === "scheduled") return "bg-blue-100 border-blue-300";
    return "bg-orange-100 border-orange-300"; // new — needs attention
}

function getDateThreshold(date: string | null): string | null {
    const now = new Date();
    if (date === "today") {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
    if (date === "week") {
        const s = new Date(now); s.setDate(now.getDate() - 7); return s.toISOString();
    }
    if (date === "month") {
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    return null;
}

export default async function ChatPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; date?: string }>;
}) {
    const { type, date } = await searchParams;
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Chat Logs</h1>
                <p className="text-sm text-muted-foreground">Please log in.</p>
            </div>
        );
    }

    let query = supabase
        .from("chat_sessions")
        .select("id, created_at, inquiry_type, lead_status, outcome, follow_up_status")
        .order("created_at", { ascending: false })
        .limit(50);

    if (type) query = query.eq("inquiry_type", type);

    const dateThreshold = getDateThreshold(date ?? null);
    if (dateThreshold) query = query.gte("created_at", dateThreshold);

    const { data, error } = await query;

    const sessions: ChatSessionRow[] = Array.isArray(data)
        ? (data.filter((r): r is ChatSessionRow => typeof r?.id === "string" && r.id.length > 0) as ChatSessionRow[])
        : [];

    return (
        <div className="space-y-5">
            {/* Header banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Conversations
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Chat Logs</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Review conversations, track outcomes, and manage follow-ups.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <MessageSquare className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Color legend */}
            <div className="rounded-xl border bg-indigo-50 px-4 py-3 flex flex-wrap gap-4 items-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Card color</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { bg: "bg-orange-100 border-orange-300", label: "New lead — needs follow-up" },
                        { bg: "bg-blue-100 border-blue-300",     label: "In progress" },
                        { bg: "bg-slate-100 border-slate-300",   label: "Closed" },
                        { bg: "bg-white border-border",          label: "Not captured" },
                    ].map(({ bg, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`inline-block h-4 w-4 rounded border-2 ${bg}`} />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-indigo-50 px-4 py-3">
                <Suspense>
                    <ChatFilters />
                </Suspense>
            </div>

            {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Error loading sessions: {error.message}
                </div>
            ) : sessions.length > 0 ? (
                <div className="space-y-2">
                    {sessions.map((s) => {
                        const inquiry  = inquiryBadge(s.inquiry_type);
                        const outcome  = outcomeBadge(s.outcome);
                        const followUp = followUpBadge(s.follow_up_status);
                        const InquiryIcon = inquiry.icon;
                        const card = cardStyle(s.lead_status, s.follow_up_status);

                        return (
                            <Link
                                key={s.id}
                                href={`/dashboard/chat/${s.id}`}
                                className={`group flex items-center gap-4 rounded-xl border px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-primary/40 ${card}`}
                            >
                                {/* Icon */}
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                </div>

                                {/* Session ID + date */}
                                <div className="w-36 shrink-0">
                                    <div className="text-sm font-semibold text-foreground font-mono">
                                        {s.id.slice(0, 8)}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {new Date(s.created_at).toLocaleString()}
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${inquiry.className}`}>
                                        <InquiryIcon className="h-3 w-3" />
                                        {inquiry.label}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${outcome.className}`}>
                                        {outcome.label}
                                    </span>
                                    {s.lead_status === "lead_captured" && (
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${followUp.className}`}>
                                            {followUp.label}
                                        </span>
                                    )}
                                </div>

                                {/* Arrow */}
                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center space-y-2">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No sessions match your filters.</p>
                    <p className="text-xs text-muted-foreground/70">Try a different damage type or date range.</p>
                </div>
            )}
        </div>
    );
}
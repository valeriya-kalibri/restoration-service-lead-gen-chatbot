import { createClient } from "@/lib/supabase/server";
import { getStepLabel } from "@/lib/chat/step-labels";
import {
    User, Phone, Mail, MapPin,
    Droplets, Flame, Wind, HelpCircle, FileText, Activity,
} from "lucide-react";
import { BackButton } from "./_components/back-button";
import { FollowUpPanel } from "./_components/follow-up-panel";

type PageProps = {
    params: Promise<{ sessionId?: string }>;
};

type SessionRow = {
    id: string;
    created_at: string;
    inquiry_type: string | null;
    last_step_id: string | null;
    lead_status: string | null;
    action_outcome: string | null;
    page_url: string | null;
    referrer: string | null;
    lead_name: string | null;
    lead_phone: string | null;
    lead_email: string | null;
    city: string | null;
    zip: string | null;
    damage_description: string | null;
    follow_up_status: string | null;
    notes: string | null;
};

type EventRow = {
    id: string;
    created_at: string;
    event_type: string;
    step_id: string | null;
    value: string | null;
    meta?: Record<string, unknown> | null;
};

const VISIBLE_EVENTS = new Set([
    "select_inquiry", "timing_selected", "location_submitted",
    "contact_submitted", "damage_described", "call_clicked",
    "callback_requested", "text_clicked",
]);

function fmtInquiry(v: string | null) {
    switch (v) {
        case "water":    return { label: "Water",    className: "bg-blue-50 text-blue-700 border-blue-200",     icon: Droplets };
        case "fire":     return { label: "Fire",     className: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame };
        case "mold":     return { label: "Mold",     className: "bg-green-50 text-green-700 border-green-200",   icon: Wind };
        default:         return { label: v ? v.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border", icon: HelpCircle };
    }
}

function fmtLeadStatus(v: string | null) {
    switch (v) {
        case "lead_captured":     return { label: "Lead captured",     className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "lead_not_captured": return { label: "Not captured",      className: "bg-red-50 text-red-600 border-red-200" };
        default:                  return { label: v ? v.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border" };
    }
}

function fmtOutcome(v: string | null) {
    switch (v) {
        case "call_initiated":     return { label: "Call initiated",     className: "bg-purple-50 text-purple-700 border-purple-200" };
        case "callback_requested": return { label: "Callback requested", className: "bg-blue-50 text-blue-700 border-blue-200" };
        case "sms_initiated":      return { label: "SMS initiated",      className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
        default:                   return { label: v ? v.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border" };
    }
}

function fmtEventTitle(v: string) {
    switch (v) {
        case "select_inquiry":      return "Issue type selected";
        case "timing_selected":     return "Timing confirmed";
        case "location_submitted":  return "Location submitted";
        case "contact_submitted":   return "Contact info submitted";
        case "damage_described":    return "Damage description submitted";
        case "call_clicked":        return "Call initiated";
        case "callback_requested":  return "Callback requested";
        case "text_clicked":        return "SMS initiated";
        default:                    return v.replace(/_/g, " ");
    }
}

function getEventValue(e: EventRow): string {
    if (e.event_type === "location_submitted") {
        const city = typeof e.meta?.city === "string" && e.meta.city.trim() ? e.meta.city.trim() : null;
        const zip  = typeof e.meta?.zip  === "string" && e.meta.zip.trim()  ? e.meta.zip.trim()  : null;
        return [city, zip].filter(Boolean).join(" ") || "Location submitted";
    }
    if (e.event_type === "contact_submitted")   return "Contact details submitted";
    if (e.event_type === "text_clicked")        return "Visitor chose to text the business";
    if (e.event_type === "call_clicked")        return "Visitor chose to call the business";
    if (e.event_type === "callback_requested")  return "Visitor requested a callback";
    return e.value ?? "—";
}

function buildSummary(s: SessionRow | null): string {
    if (!s) return "No session summary available.";
    const inquiry  = fmtInquiry(s.inquiry_type).label;
    const location = [s.city, s.zip].filter(Boolean).join(" ").trim() || "location not provided";
    const outcome  = fmtOutcome(s.action_outcome).label;
    if (s.lead_status === "lead_captured") {
        return `${inquiry} issue reported in ${location}. Lead was captured. Final action: ${outcome}.`;
    }
    return `${inquiry} issue reported in ${location}. Lead was not captured. Last step: ${s.last_step_id ? getStepLabel(s.last_step_id) : "unknown"}.`;
}

export default async function SessionDetailsPage({ params }: PageProps) {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-bold text-primary">Session Details</h1>
                <p className="text-sm text-muted-foreground">Session not found.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-bold text-primary">Session Details</h1>
                <p className="text-sm text-muted-foreground">Please log in.</p>
            </div>
        );
    }

    const { data: session, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("id,created_at,inquiry_type,last_step_id,lead_status,action_outcome,page_url,referrer,lead_name,lead_phone,lead_email,city,zip,damage_description,follow_up_status,notes")
        .eq("id", sessionId)
        .single<SessionRow>();

    const { data: events, error: eventsErr } = await supabase
        .from("chat_events")
        .select("id,created_at,event_type,step_id,value,meta")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    const visibleEvents = ((events ?? []) as EventRow[]).filter((e) => VISIBLE_EVENTS.has(e.event_type));

    const inquiry    = fmtInquiry(session?.inquiry_type ?? null);
    const leadStatus = fmtLeadStatus(session?.lead_status ?? null);
    const outcome    = fmtOutcome(session?.action_outcome ?? null);
    const lastStep   = session?.last_step_id ? getStepLabel(session.last_step_id) : "—";
    const InquiryIcon = inquiry.icon;

    return (
        <div className="space-y-5">
            {/* Back + Banner */}
            <div className="space-y-3">
                <BackButton />

                <div className="rounded-xl bg-primary px-6 py-5 text-white">
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">Session Details</p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {session?.lead_name ?? "Unknown Visitor"}
                    </h1>
                    <p className="mt-0.5 text-xs text-white/50 font-mono">Session ID: {sessionId}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${inquiry.className}`}>
                            <InquiryIcon className="h-3 w-3" /> {inquiry.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${leadStatus.className}`}>
                            {leadStatus.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${outcome.className}`}>
                            {outcome.label}
                        </span>
                        <span className="text-xs text-white/50">
                            {session ? new Date(session.created_at).toLocaleString() : ""}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lead info */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Lead Information</h2>
                </div>

                {session?.lead_phone ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                            { icon: User,   label: "Name",     value: session.lead_name ?? "—" },
                            { icon: Phone,  label: "Phone",    value: session.lead_phone },
                            { icon: Mail,   label: "Email",    value: session.lead_email ?? "—" },
                            { icon: MapPin, label: "Location", value: [session.city, session.zip].filter(Boolean).join(" ") || "—" },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="rounded-xl border bg-white px-4 py-3 flex items-start gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                                    <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                                    <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No contact information was submitted in this session.</p>
                )}
            </div>

            {/* Summary + Damage description */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Summary</h2>
                    </div>
                    <div className="rounded-xl border bg-white px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                        {buildSummary(session ?? null)}
                    </div>
                </div>

                <div className="rounded-xl border bg-indigo-50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Issue Description</h2>
                    </div>
                    <div className="rounded-xl border bg-white px-4 py-3 text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                        {session?.damage_description ?? "No damage description submitted."}
                    </div>
                </div>
            </div>


            {/* Session outline */}
            {session && !sessionErr && (
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Session Outline</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                            { label: "Created",       value: new Date(session.created_at).toLocaleString() },
                            { label: "Inquiry Type",  value: inquiry.label },
                            { label: "Last Step",     value: lastStep },
                            { label: "Lead Status",   value: leadStatus.label },
                            { label: "Outcome",       value: outcome.label },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl border bg-white px-4 py-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                                <div className="text-sm font-medium text-foreground mt-1">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Follow-up */}
            {session && (
                <FollowUpPanel
                    sessionId={session.id}
                    initialStatus={session.follow_up_status ?? "new"}
                    initialNotes={session.notes ?? ""}
                />
            )}

            {/* Event timeline */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <h2 className="text-sm font-bold tracking-widest uppercase text-foreground mb-4">Event Timeline</h2>

                {eventsErr ? (
                    <p className="text-sm text-destructive">Error loading events: {eventsErr.message}</p>
                ) : visibleEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recorded events for this session.</p>
                ) : (
                    <div className="relative space-y-0">
                        {visibleEvents.map((e, i) => (
                            <div key={e.id} className="flex gap-4">
                                {/* Timeline spine */}
                                <div className="flex flex-col items-center">
                                    <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10 shrink-0 mt-3.5" />
                                    {i < visibleEvents.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-primary/20 my-1" />
                                    )}
                                </div>

                                {/* Event card */}
                                <div className="flex-1 pb-4">
                                    <div className="rounded-xl border bg-white px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-semibold text-foreground">{fmtEventTitle(e.event_type)}</span>
                                            <span className="text-[11px] text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{getEventValue(e)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
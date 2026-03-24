import { createClient } from "@/lib/supabase/server";
import { OutcomeButtons } from "./_components/outcome-buttons";
import { getStepLabel } from "@/lib/chat/step-labels";

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
    "select_inquiry",
    "timing_selected",
    "location_submitted",
    "contact_submitted",
    "damage_described",
    "call_clicked",
    "callback_requested",
    "text_clicked",
]);

function formatInquiryType(value: string | null): string {
    if (!value) return "—";

    switch (value) {
        case "water":
            return "Water";
        case "fire":
            return "Fire";
        case "mold":
            return "Mold";
        case "not_sure":
            return "Not sure";
        default:
            return value;
    }
}

function formatLeadStatus(value: string | null): string {
    if (!value) return "—";

    switch (value) {
        case "lead_captured":
            return "Lead captured";
        case "lead_not_captured":
            return "Lead not captured";
        default:
            return value.replace(/_/g, " ");
    }
}

function formatActionOutcome(value: string | null): string {
    if (!value) return "—";

    switch (value) {
        case "call_initiated":
            return "Call initiated";
        case "callback_requested":
            return "Callback requested";
        case "sms_initiated":
            return "SMS initiated";
        case "unknown":
            return "Unknown";
        default:
            return value.replace(/_/g, " ");
    }
}

function formatEventTitle(value: string): string {
    switch (value) {
        case "select_inquiry":
            return "Issue type selected";
        case "timing_selected":
            return "Timing confirmed";
        case "location_submitted":
            return "Location submitted";
        case "contact_submitted":
            return "Contact information submitted";
        case "damage_described":
            return "Damage description submitted";
        case "call_clicked":
            return "Call initiated";
        case "callback_requested":
            return "Callback requested";
        case "text_clicked":
            return "SMS initiated";
        default:
            return value.replace(/_/g, " ");
    }
}

function getEventDisplayValue(e: EventRow): string {
    if (e.event_type === "location_submitted") {
        const city =
            typeof e.meta?.city === "string" && e.meta.city.trim() ? e.meta.city.trim() : null;
        const zip =
            typeof e.meta?.zip === "string" && e.meta.zip.trim() ? e.meta.zip.trim() : null;

        const location = [city, zip].filter(Boolean).join(" ").trim();
        return location || "Location submitted";
    }

    if (e.event_type === "contact_submitted") {
        return "Contact details submitted";
    }

    if (e.event_type === "text_clicked") {
        return "Visitor chose to text the business";
    }

    if (e.event_type === "call_clicked") {
        return "Visitor chose to call the business";
    }

    if (e.event_type === "callback_requested") {
        return "Visitor requested a callback";
    }

    return e.value ?? "—";
}

function buildConversationSummary(session: SessionRow | null): string {
    if (!session) return "No session summary available.";

    const inquiry = formatInquiryType(session.inquiry_type);
    const location =
        [session.city, session.zip].filter(Boolean).join(" ").trim() || "location not provided";
    const lead = session.lead_status === "lead_captured" ? "Lead was captured" : "Lead was not captured";
    const action = formatActionOutcome(session.action_outcome);

    if (session.lead_status === "lead_captured") {
        return `${inquiry} issue reported in ${location}. ${lead}. Final action outcome: ${action}.`;
    }

    return `${inquiry} issue reported in ${location}. ${lead}. Last recorded step: ${session.last_step_id ? getStepLabel(session.last_step_id) : "unknown"}.`;
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
        .select(`
      id,
      created_at,
      inquiry_type,
      last_step_id,
      lead_status,
      action_outcome,
      page_url,
      referrer,
      lead_name,
      lead_phone,
      lead_email,
      city,
      zip,
      damage_description
    `)
        .eq("id", sessionId)
        .single<SessionRow>();

    const { data: events, error: eventsErr } = await supabase
        .from("chat_events")
        .select("id, created_at, event_type, step_id, value, meta")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .returns<EventRow[]>();

    const visibleEvents = (events ?? []).filter((e) => VISIBLE_EVENTS.has(e.event_type));

    const inquiryLabel = formatInquiryType(session?.inquiry_type ?? null);
    const leadStatusLabel = formatLeadStatus(session?.lead_status ?? null);
    const actionOutcomeLabel = formatActionOutcome(session?.action_outcome ?? null);
    const lastStepLabel = session?.last_step_id ? getStepLabel(session.last_step_id) : "—";
    const conversationSummary = buildConversationSummary(session ?? null);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-lg font-bold text-primary">SESSION DETAILS</h1>
                <p className="text-sm text-muted-foreground">
                    Session ID: <span className="font-mono break-all text-foreground">{sessionId}</span>
                </p>
            </div>

            <div className="space-y-1 rounded-md border p-4">
                

                <p className="text-xs text-muted-foreground">
                    Lead status shows whether contact information was captured or not.
                    <br />
                    Action outcome shows last action taken by the visitor.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2 text-sm sm:grid-cols-2">
                    <div className="rounded-md border p-4">
                        <div className="text-base font-bold text-primary">LEAD STATUS</div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                            {leadStatusLabel}
                        </div>
                    </div>

                    <div className="rounded-md border p-4">
                        <div className="text-base font-bold text-primary">ACTION OUTCOME</div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                            {actionOutcomeLabel}
                        </div>
                    </div>
                </div>

                <OutcomeButtons
                    sessionId={sessionId}
                    currentActionOutcome={session?.action_outcome}
                />
            </div>

            <div className="rounded-md border p-4">
                <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                    SUMMARY
                </div>

                <div className="rounded-md border p-4">
                    <div className="text-sm text-foreground">{conversationSummary}</div>
                </div>
            </div>

            <div className="rounded-md border p-4">
                <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                    LEAD INFORMATION
                </div>

                {session?.lead_phone ? (
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Name</div>
                            <div className="mt-1 text-foreground">{session.lead_name ?? "—"}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Phone</div>
                            <div className="mt-1 text-foreground">{session.lead_phone}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Email</div>
                            <div className="mt-1 text-foreground">{session.lead_email ?? "—"}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Location</div>
                            <div className="mt-1 text-foreground">
                                {session.city || session.zip
                                    ? `${session.city ?? ""} ${session.zip ?? ""}`.trim()
                                    : "—"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No contact information was submitted.
                    </p>
                )}
            </div>

            <div className="rounded-md border p-4">
                <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                    ISSUE DESCRIPTION
                </div>

                {session?.damage_description ? (
                    <div className="rounded-md border p-4">
                        <div className="text-sm text-foreground">{session.damage_description}</div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No damage description was submitted.
                    </p>
                )}
            </div>

            {sessionErr ? (
                <div className="rounded-md border p-3 text-sm">
                    Error loading session: {sessionErr.message}
                </div>
            ) : session ? (
                <div className="rounded-md border p-4">
                    <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                        SESSION OUTLINE
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Created</div>
                            <div className="mt-1 text-foreground">
                                {new Date(session.created_at).toLocaleString()}
                            </div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Inquiry Type</div>
                            <div className="mt-1 text-foreground">{inquiryLabel}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Last Step Reached</div>
                            <div className="mt-1 text-foreground">{lastStepLabel}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Lead Status</div>
                            <div className="mt-1 text-foreground">{leadStatusLabel}</div>
                        </div>

                        <div className="rounded-md border p-3">
                            <div className="text-xs font-medium text-primary">Action Outcome</div>
                            <div className="mt-1 text-foreground">{actionOutcomeLabel}</div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="space-y-2">
                <h2 className="text-base font-semibold text-primary tracking-tight">
                    EVENT TIMELINE
                </h2>

                {eventsErr ? (
                    <div className="rounded-md border p-3 text-sm">
                        Error loading events: {eventsErr.message}
                    </div>
                ) : visibleEvents.length > 0 ? (
                    <div className="space-y-3">
                        {visibleEvents.map((e) => {
                            const eventTitle = formatEventTitle(e.event_type);
                            const stepLabel = e.step_id ? getStepLabel(e.step_id) : "—";
                            const displayValue = getEventDisplayValue(e);

                            return (
                                <div key={e.id} className="rounded-md border p-4 text-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="font-medium text-foreground">{eventTitle}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(e.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <div className="text-xs font-medium text-primary">Step</div>
                                            <div className="mt-1 text-sm text-foreground">{stepLabel}</div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-medium text-primary">Value</div>
                                            <div className="mt-1 text-sm text-foreground">{displayValue}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        No visible events yet.
                    </div>
                )}
            </div>
        </div>
    );
}
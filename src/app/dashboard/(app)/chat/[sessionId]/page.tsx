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
    outcome: string | null;
    page_url: string | null;
    referrer: string | null;
    lead_name: string | null;
    lead_phone: string | null;
    lead_email: string | null;
    city: string | null;
    zip: string | null;
};

type EventRow = {
    id: string;
    created_at: string;
    event_type: string;
    step_id: string | null;
    value: string | null;
};

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

function formatOutcome(value: string | null): string {
    if (!value) return "—";

    switch (value) {
        case "call_initiated":
            return "Call initiated";
        case "callback_requested":
            return "Callback requested";
        case "lead_captured":
            return "Lead captured";
        case "abandoned":
            return "Abandoned";
        case "unknown":
            return "Unknown";
        default:
            return value.replace(/_/g, " ");
    }
}

function formatEventType(value: string): string {
    switch (value) {
        case "session_started":
            return "Session started";
        case "step_answered":
            return "Question answered";
        case "outcome_set":
            return "Outcome updated";
        case "lead_captured":
            return "Lead captured";
        case "callback_requested":
            return "Callback requested";
        case "call_initiated":
            return "Call initiated";
        default:
            return value.replace(/_/g, " ");
    }
}

export default async function SessionDetailsPage({ params }: PageProps) {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold text-primary">Session Details</h1>
                <p className="text-sm text-muted-foreground">Session not found.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold text-primary">Session Details</h1>
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
      outcome,
      page_url,
      referrer,
      lead_name,
      lead_phone,
      lead_email,
      city,
      zip
    `)
        .eq("id", sessionId)
        .single<SessionRow>();

    const { data: events, error: eventsErr } = await supabase
        .from("chat_events")
        .select("id, created_at, event_type, step_id, value")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .returns<EventRow[]>();

    const inquiryLabel = formatInquiryType(session?.inquiry_type ?? null);
    const outcomeLabel = formatOutcome(session?.outcome ?? null);
    const lastStepLabel = session?.last_step_id ? getStepLabel(session.last_step_id) : "—";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-lg font-semibold text-primary">Session Details</h1>
                <p className="text-sm text-muted-foreground">
                    Session ID: <span className="font-mono break-all text-foreground">{sessionId}</span>
                </p>
            </div>

            {/* Outcome */}
            <div className="space-y-1 rounded-md border p-4">
                <div className="text-base font-semibold text-primary tracking-tight">Outcome</div>
                <p className="text-xs text-muted-foreground">
                    {session?.outcome === "call_initiated"
                        ? "Call initiated means the visitor tapped Call to reach you right away."
                        : session?.outcome === "callback_requested"
                            ? "Callback requested means the visitor asked the business to contact them after submitting their information."
                            : session?.outcome === "lead_captured"
                                ? "Lead captured means the visitor shared their contact information, even if no call was placed."
                                : session?.outcome === "abandoned"
                                    ? "Abandoned means the visitor left before sharing contact details."
                                    : session?.outcome === "unknown"
                                        ? "Unknown means the session ended before we could categorize it."
                                        : "Choose an outcome to categorize this session."}
                </p>

                <div className="pt-1 text-sm">
                    <span className="font-medium text-primary">Current outcome:</span>{" "}
                    <span className="text-foreground">{outcomeLabel}</span>
                </div>

                <OutcomeButtons
                    sessionId={sessionId}
                    currentOutcome={session?.outcome}
                />
            </div>

            {/* Lead Information */}
            <div className="rounded-md border p-4">
                <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                    Lead Information
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

            {/* Session Meta */}
            {sessionErr ? (
                <div className="rounded-md border p-3 text-sm">
                    Error loading session: {sessionErr.message}
                </div>
            ) : session ? (
                <div className="rounded-md border p-4">
                    <div className="mb-3 text-base font-semibold text-primary tracking-tight">
                        Session Summary
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
                            <div className="text-xs font-medium text-primary">Outcome</div>
                            <div className="mt-1 text-foreground">{outcomeLabel}</div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Timeline */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold text-primary tracking-tight">
                    Event Timeline
                </h2>

                {eventsErr ? (
                    <div className="rounded-md border p-3 text-sm">
                        Error loading events: {eventsErr.message}
                    </div>
                ) : events && events.length > 0 ? (
                    <div className="space-y-3">
                        {events.map((e) => {
                            const eventLabel = formatEventType(e.event_type);
                            const stepLabel = e.step_id ? getStepLabel(e.step_id) : "—";

                            return (
                                <div key={e.id} className="rounded-md border p-4 text-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="font-medium text-foreground">{eventLabel}</div>
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
                                            <div className="mt-1 text-sm text-foreground">{e.value ?? "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        No events yet.
                    </div>
                )}
            </div>
        </div>
    );
}
import { createClient } from "@/lib/supabase/server";
import { OutcomeButtons } from "./_components/outcome-buttons";

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

    // Lead fields
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

export default async function SessionDetailsPage({ params }: PageProps) {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Session Details</h1>
                <p className="text-sm text-muted-foreground">Session not found.</p>
            </div>
        );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Session Details</h1>
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-lg font-semibold">Session Details</h1>
                <p className="text-sm text-muted-foreground">
                    Session ID: <span className="font-mono break-all">{sessionId}</span>
                </p>
            </div>

            {/* Outcome */}
            <div className="rounded-md border p-4 space-y-1">
                <div className="text-sm font-semibold">Outcome</div>
                <p className="text-xs text-muted-foreground">
                    {session?.outcome === "call_initiated"
                        ? "Call initiated means the visitor tapped Call to reach you right away."
                        : session?.outcome === "callback_requested"
                            ? "Callback requested means the visitor asked you to contact them and submitted their phone number."
                            : session?.outcome === "lead_captured"
                                ? "Lead captured means the visitor shared their contact information, even if no call was placed."
                                : session?.outcome === "abandoned"
                                    ? "Abandoned means the visitor left before sharing contact details."
                                    : session?.outcome === "unknown"
                                        ? "Unknown means the session ended before we could categorize it."
                                        : "Choose an outcome to categorize this session."}
                </p>

                <OutcomeButtons
                    sessionId={sessionId}
                    currentOutcome={session?.outcome}
                />
            </div>

            {/* Lead Information */}
            <div className="rounded-md border p-4">
                <div className="text-sm font-semibold mb-2">Lead information</div>

                {session?.lead_phone ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                        <div>
                            <div className="text-xs text-muted-foreground">Name</div>
                            <div>{session.lead_name ?? "—"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                            <div>{session.lead_phone}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div>{session.lead_email ?? "—"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div>
                                {session.city || session.zip
                                    ? `${session.city ?? ""} ${session.zip ?? ""}`
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
                <div className="rounded-md border p-3 text-sm">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                            <div className="text-xs text-muted-foreground">Created</div>
                            <div>{new Date(session.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Inquiry</div>
                            <div>{session.inquiry_type ?? "—"}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Last step</div>
                            <div>{session.last_step_id ?? "—"}</div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Timeline */}
            <div className="space-y-2">
                <h2 className="text-sm font-semibold">Event timeline</h2>

                {eventsErr ? (
                    <div className="rounded-md border p-3 text-sm">
                        Error loading events: {eventsErr.message}
                    </div>
                ) : events && events.length > 0 ? (
                    <div className="space-y-2">
                        {events.map((e) => (
                            <div key={e.id} className="rounded-md border p-3 text-sm">
                                <div className="flex justify-between">
                                    <div className="font-medium">{e.event_type}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(e.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Step: {e.step_id ?? "—"} · Value: {e.value ?? "—"}
                                </div>
                            </div>
                        ))}
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

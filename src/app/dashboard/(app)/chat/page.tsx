import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStepLabel } from "@/lib/chat/step-labels";

type ChatSessionRow = {
    id: string;
    created_at: string;
    inquiry_type: string | null;
    last_step_id: string | null;
    outcome: string | null;
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
        case "lead_captured":
            return "Lead captured";
        case "callback_requested":
            return "Callback requested";
        case "call_initiated":
            return "Call initiated";
        case "abandoned":
            return "Abandoned";
        default:
            return value.replace(/_/g, " ");
    }
}

export default async function ChatPage() {
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

    const { data, error } = await supabase
        .from("chat_sessions")
        .select("id, created_at, inquiry_type, last_step_id, outcome")
        .order("created_at", { ascending: false })
        .limit(25);

    const sessions: ChatSessionRow[] = Array.isArray(data)
        ? (data.filter((r): r is ChatSessionRow => typeof r?.id === "string" && r.id.length > 0) as ChatSessionRow[])
        : [];

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="text-lg font-semibold text-primary">Chat Logs</h1>
                <p className="text-sm text-muted-foreground">
                    Review conversations, see where users stopped, and track outcomes.
                </p>
            </div>

            {error ? (
                <div className="rounded-md border p-3 text-sm">
                    Error loading sessions: {error.message}
                </div>
            ) : sessions.length > 0 ? (
                <div className="space-y-3">
                    {sessions.map((s) => {
                        const lastStepLabel = s.last_step_id ? getStepLabel(s.last_step_id) : "—";
                        const inquiryLabel = formatInquiryType(s.inquiry_type);
                        const outcomeLabel = formatOutcome(s.outcome);

                        return (
                            <Link
                                key={s.id}
                                href={`/dashboard/chat/${s.id}`}
                                className="block rounded-md border p-4 transition-colors hover:bg-muted/40"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-foreground">
                                            Session {s.id.slice(0, 8)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(s.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="text-xs font-medium text-primary">
                                        View conversation
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-md border bg-background p-3">
                                        <div className="text-xs font-medium text-primary">
                                            Inquiry Type
                                        </div>
                                        <div className="mt-1 text-sm text-foreground">
                                            {inquiryLabel}
                                        </div>
                                    </div>

                                    <div className="rounded-md border bg-background p-3">
                                        <div className="text-xs font-medium text-primary">
                                            Last Step Reached
                                        </div>
                                        <div className="mt-1 text-sm text-foreground">
                                            {lastStepLabel}
                                        </div>
                                    </div>

                                    <div className="rounded-md border bg-background p-3">
                                        <div className="text-xs font-medium text-primary">
                                            Outcome
                                        </div>
                                        <div className="mt-1 text-sm text-foreground">
                                            {outcomeLabel}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    No chat sessions yet.
                </div>
            )}
        </div>
    );
}

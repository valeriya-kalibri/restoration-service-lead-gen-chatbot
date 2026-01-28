import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ChatSessionRow = {
    id: string;
    created_at: string;
    inquiry_type: string | null;
    last_step_id: string | null;
    outcome: string | null;
};

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

    // Normalize + hard-guard against bad rows so we never link to /undefined
    const sessions: ChatSessionRow[] = Array.isArray(data)
        ? (data.filter((r): r is ChatSessionRow => typeof r?.id === "string" && r.id.length > 0) as ChatSessionRow[])
        : [];

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="text-lg font-semibold">Chat Logs</h1>
                <p className="text-sm text-muted-foreground">
                    Review conversations, see drop-off step, and outcomes.
                </p>
            </div>

            {error ? (
                <div className="rounded-md border p-3 text-sm">
                    Error loading sessions: {error.message}
                </div>
            ) : sessions.length > 0 ? (
                <div className="space-y-2">
                    {sessions.map((s) => (
                        <Link
                            key={s.id}
                            href={`/dashboard/chat/${s.id}`}
                            className="block rounded-md border p-3 hover:bg-muted/40"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm font-medium">Session {s.id.slice(0, 8)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(s.created_at).toLocaleString()}
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                                <div>Inquiry: {s.inquiry_type ?? "—"}</div>
                                <div>Last step: {s.last_step_id ?? "—"}</div>
                                <div>Outcome: {s.outcome ?? "—"}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    No chat sessions yet.
                </div>
            )}
        </div>
    );
}


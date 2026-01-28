import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Keep outcomes here for now (single-step). We'll centralize later.
const ALLOWED_OUTCOMES = [
    "call_initiated",
    "callback_requested",
    "lead_captured",
    "abandoned",
    "unknown",
] as const;

type ChatOutcome = (typeof ALLOWED_OUTCOMES)[number];

function isChatOutcome(x: unknown): x is ChatOutcome {
    return typeof x === "string" && (ALLOWED_OUTCOMES as readonly string[]).includes(x);
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 401 });
        }
        if (!auth?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const session_id = body?.session_id;
        const outcome = body?.outcome;

        if (!session_id || typeof session_id !== "string") {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }
        if (!isChatOutcome(outcome)) {
            return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
        }

      
       

        const { error: updErr } = await supabase
            .from("chat_sessions")
            .update({
                outcome,
                ended_at: new Date().toISOString(),
            })
            .eq("id", session_id);

        if (updErr) {
            return NextResponse.json({ error: updErr.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, outcome });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
    }
}

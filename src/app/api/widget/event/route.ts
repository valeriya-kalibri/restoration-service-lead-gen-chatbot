// this file is the public intake API endpoint the widget will call.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body =
    | {
        type: "session_start";
        client_id: string; // the restoration company user in your app
        page_url?: string | null;
        referrer?: string | null;
    }
    | {
        type: "event";
        client_id: string;
        session_id: string;
        event_type: string; // e.g. "select_inquiry"
        step_id?: string | null; // e.g. "q1"
        value?: string | null; // e.g. "water"
        meta?: Record<string, any>;
        last_step_id?: string | null; // update session
    }
    | {
        type: "set_outcome";
        client_id: string;
        session_id: string;
        outcome: "booked" | "requested_human" | "abandoned";
    };

export async function POST(req: Request) {
    const supabase = await createClient();

    let body: Body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // IMPORTANT:
    // For v1 we trust client_id coming from the widget embed config (later we’ll sign it).
    // This endpoint MUST remain write-safe via RLS (client_id scoping).

    if (body.type === "session_start") {
        if (!body.client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

        const { data, error } = await supabase
            .from("chat_sessions")
            .insert({
                client_id: body.client_id,
                page_url: body.page_url ?? null,
                referrer: body.referrer ?? null,
                outcome: "unknown",
                last_step_id: "start",
            })
            .select("id")
            .single();

        if (error) {
            return NextResponse.json({ error: "Failed to create session", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, session_id: data.id });
    }

    if (body.type === "event") {
        if (!body.client_id || !body.session_id) {
            return NextResponse.json({ error: "client_id + session_id required" }, { status: 400 });
        }

        const { error: evErr } = await supabase.from("chat_events").insert({
            client_id: body.client_id,
            session_id: body.session_id,
            event_type: body.event_type,
            step_id: body.step_id ?? null,
            value: body.value ?? null,
            meta: body.meta ?? {},
        });

        if (evErr) {
            return NextResponse.json({ error: "Failed to insert event", details: evErr.message }, { status: 500 });
        }

        if (body.last_step_id) {
            const { error: upErr } = await supabase
                .from("chat_sessions")
                .update({ last_step_id: body.last_step_id })
                .eq("id", body.session_id)
                .eq("client_id", body.client_id);

            if (upErr) {
                return NextResponse.json({ error: "Failed to update session", details: upErr.message }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true });
    }

    // set_outcome
    if (!body.client_id || !body.session_id) {
        return NextResponse.json({ error: "client_id + session_id required" }, { status: 400 });
    }

    const endedAt = new Date().toISOString();

    const { error: outErr } = await supabase
        .from("chat_sessions")
        .update({ outcome: body.outcome, ended_at: endedAt, last_step_id: "done" })
        .eq("id", body.session_id)
        .eq("client_id", body.client_id);

    if (outErr) {
        return NextResponse.json({ error: "Failed to set outcome", details: outErr.message }, { status: 500 });
    }

    await supabase.from("chat_events").insert({
        client_id: body.client_id,
        session_id: body.session_id,
        event_type: "outcome_set",
        step_id: "outcome",
        value: body.outcome,
        meta: {},
    });

    return NextResponse.json({ ok: true });
}

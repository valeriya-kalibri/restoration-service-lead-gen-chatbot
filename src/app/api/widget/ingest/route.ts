import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms/send-sms";

type Body = {
    key: string; // widget_key
    session_id?: string;
    event_type: string;
    step_id?: string;
    value?: string;
    meta?: Record<string, unknown>;
    session?: {
        page_url?: string;
        referrer?: string;
        visitor_id?: string;
    };
};

function normalizePhone(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    const s = raw.trim();
    if (!s) return null;
    if (s.startsWith("+")) return s;

    const digits = s.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return null;
}

function str(x: unknown): string | null {
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

function safeText(x: unknown): string | null {
    if (typeof x !== "string") return null;
    const t = x.trim();
    return t.length ? t : null;
}

function isMissingTwilioEnvError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.toLowerCase().includes("missing twilio environment variables");
}

export async function POST(req: Request) {
    const supabase = createAdminClient();

    let body: Body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
    if (!body.event_type) return NextResponse.json({ error: "Missing event_type" }, { status: 400 });

    // 0) Resolve client_id from widget_key
    // 0) Resolve client_id from widget_key directly from profiles
    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, business_name, business_phone, widget_key")
        .eq("widget_key", body.key)
        .maybeSingle();

    if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    if (!profile?.id) {
        return NextResponse.json({ error: "Invalid key" }, { status: 404 });
    }

    const clientId = profile.id;
    const businessPhone = normalizePhone(profile.business_phone);
    const businessName = safeText(profile.business_name) ?? "Restoration team";

    // 1) Ensure session exists
    let sessionId = body.session_id;

    if (!sessionId) {
        const s = body.session ?? {};
        const { data: created, error: createErr } = await supabase
            .from("chat_sessions")
            .insert({
                client_id: clientId,
                page_url: s.page_url ?? null,
                referrer: s.referrer ?? null,
                visitor_id: s.visitor_id ?? null,
                last_step_id: body.step_id ?? null,
                outcome: "unknown",
            })
            .select("id")
            .single();

        if (createErr || !created?.id) {
            return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
        }
        sessionId = created.id;
    }

    // TS hard guarantee
    if (!sessionId) {
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    const sid = sessionId;

    // 2) Insert event
    const { error: eventErr } = await supabase.from("chat_events").insert({
        client_id: clientId,
        session_id: sid,
        event_type: body.event_type,
        step_id: body.step_id ?? null,
        value: body.value ?? null,
        meta: body.meta ?? {},
    });

    if (eventErr) return NextResponse.json({ error: eventErr.message }, { status: 500 });

    // 3) Sync summary fields
    if (body.step_id) {
        await supabase
            .from("chat_sessions")
            .update({ last_step_id: body.step_id })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    if (body.event_type === "select_inquiry") {
        await supabase
            .from("chat_sessions")
            .update({ inquiry_type: body.value ?? null })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    if (body.event_type === "timing_selected") {
        const t = body.value === "ongoing" || body.value === "stopped" ? body.value : null;

        await supabase
            .from("chat_sessions")
            .update({
                timing: t,
                is_ongoing: t === "ongoing" ? true : t === "stopped" ? false : null,
            })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // call click → call_initiated
    if (body.event_type === "call_clicked") {
        await supabase
            .from("chat_sessions")
            .update({
                outcome: "call_initiated",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // callback request → callback_requested
    if (body.event_type === "callback_requested") {
        await supabase
            .from("chat_sessions")
            .update({
                outcome: "callback_requested",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // text click → keep as tracked action event (not main outcome)
    if (body.event_type === "text_clicked") {
        await supabase.from("chat_events").insert({
            client_id: clientId,
            session_id: sid,
            event_type: "text_initiated",
            step_id: body.step_id ?? "done",
            value: body.value ?? "text_initiated",
            meta: {},
        });
    }
    
    // contact_submitted → lead_captured + send SMS (non-fatal)
    if (body.event_type === "contact_submitted") {
        const meta = body.meta ?? {};
        const lead_name = str(meta["lead_name"] ?? meta["name"]);
        const lead_email = str(meta["lead_email"] ?? meta["email"]);
        const city = str(meta["city"]);
        const zip = str(meta["zip"]);
        const preferred_contact = str(meta["preferred_contact"]);
        const lead_phone = normalizePhone(meta["lead_phone"] ?? meta["phone"]);

        const { data: existing } = await supabase
            .from("chat_sessions")
            .select("outcome, inquiry_type, timing, is_ongoing")
            .eq("id", sid)
            .eq("client_id", clientId)
            .single();

        const prevOutcome = typeof existing?.outcome === "string" ? existing.outcome : null;
        const nextOutcome = !prevOutcome || prevOutcome === "unknown" ? "lead_captured" : prevOutcome;

        await supabase
            .from("chat_sessions")
            .update({
                lead_name,
                lead_phone,
                lead_email,
                city,
                zip,
                preferred_contact,
                business_phone: businessPhone,
                outcome: nextOutcome,
            })
            .eq("id", sid)
            .eq("client_id", clientId);

        const inquiry = (existing?.inquiry_type ?? "").toString() || "not_sure";
        const timing =
            typeof existing?.timing === "string" && existing.timing
                ? existing.timing
                : typeof existing?.is_ongoing === "boolean"
                    ? existing.is_ongoing
                        ? "ongoing"
                        : "stopped"
                    : "unknown";

        const loc = [city, zip].filter(Boolean).join(" ") || "—";
        const leadLine = `${lead_name ?? "—"} • ${lead_phone ?? "—"}${lead_email ? ` • ${lead_email}` : ""}`;

        const businessBody =
            `New lead\n` +
            `Inquiry: ${inquiry}\n` +
            `Timing: ${timing}\n` +
            `Location: ${loc}\n` +
            `Lead: ${leadLine}\n` +
            `Action: Call ASAP`;

        const leadBody = businessPhone
            ? `We got your request. For fastest help, call/text ${businessPhone}.\n\nSincerely,\n${businessName}`
            : `We got your request. The restoration team will reach out ASAP.\n\nSincerely,\n${businessName}`;

        // Business SMS
        if (!businessPhone) {
            await supabase.from("chat_events").insert({
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_business",
                step_id: null,
                value: null,
                meta: { reason: "Missing business_phone in chatbot_settings" },
            });
        } else {
            try {
                const msg = await sendSms(businessPhone, businessBody);
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_sent_business",
                    step_id: null,
                    value: null,
                    meta: { to: businessPhone, sid: (msg as any)?.sid ?? null },
                });
            } catch (e: any) {
                const skipped = isMissingTwilioEnvError(e);
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sid,
                    event_type: skipped ? "sms_skipped_business" : "sms_failed_business",
                    step_id: null,
                    value: null,
                    meta: {
                        to: businessPhone,
                        error: e?.message ?? "sendSms threw",
                        reason: skipped ? "Twilio not configured" : undefined,
                    },
                });
            }
        }

        // Lead SMS (one-way)
        if (!lead_phone) {
            await supabase.from("chat_events").insert({
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_lead",
                step_id: null,
                value: null,
                meta: { reason: "Missing lead_phone in contact_submitted meta" },
            });
        } else {
            try {
                const msg2 = await sendSms(lead_phone, leadBody);
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_sent_lead",
                    step_id: null,
                    value: null,
                    meta: { to: lead_phone, sid: (msg2 as any)?.sid ?? null },
                });
            } catch (e: any) {
                const skipped = isMissingTwilioEnvError(e);
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sid,
                    event_type: skipped ? "sms_skipped_lead" : "sms_failed_lead",
                    step_id: null,
                    value: null,
                    meta: {
                        to: lead_phone,
                        error: e?.message ?? "sendSms threw",
                        reason: skipped ? "Twilio not configured" : undefined,
                    },
                });
            }
        }
    }

    // damage_described optional → store + 2nd SMS (non-fatal)
    if (body.event_type === "damage_described") {
        const desc = safeText(body.value);

        if (desc) {
            await supabase
                .from("chat_sessions")
                .update({ damage_description: desc })
                .eq("id", sid)
                .eq("client_id", clientId);

            if (!businessPhone) {
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_skipped_business_details",
                    step_id: "q5_description",
                    value: null,
                    meta: { reason: "Missing business_phone in chatbot_settings" },
                });
            } else {
                const detailsBody = `Lead update\nDetails: ${desc}\nSession: ${sid}`;
                try {
                    const msg = await sendSms(businessPhone, detailsBody);
                    await supabase.from("chat_events").insert({
                        client_id: clientId,
                        session_id: sid,
                        event_type: "sms_sent_business_details",
                        step_id: "q5_description",
                        value: null,
                        meta: { to: businessPhone, sid: (msg as any)?.sid ?? null },
                    });
                } catch (e: any) {
                    const skipped = isMissingTwilioEnvError(e);
                    await supabase.from("chat_events").insert({
                        client_id: clientId,
                        session_id: sid,
                        event_type: skipped ? "sms_skipped_business_details" : "sms_failed_business_details",
                        step_id: "q5_description",
                        value: null,
                        meta: {
                            to: businessPhone,
                            error: e?.message ?? "sendSms threw",
                            reason: skipped ? "Twilio not configured" : undefined,
                        },
                    });
                }
            }
        }
    }

    return NextResponse.json({ ok: true, session_id: sid });
}

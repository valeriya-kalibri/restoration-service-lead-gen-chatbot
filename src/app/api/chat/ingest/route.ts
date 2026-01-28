import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms/send-sms";

type EventType =
    | "select_inquiry"
    | "timing_selected"
    | "location_submitted"
    | "contact_submitted"
    | "damage_described"
    | "call_clicked"
    | "text_clicked";

type IngestEventBody = {
    session_id?: string;
    event_type: EventType;
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

export async function POST(req: Request) {
    const supabase = await createClient();

    // For now: must be logged in (dashboard test mode)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clientId = userData.user.id;

    let body: IngestEventBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.event_type) {
        return NextResponse.json({ error: "event_type is required" }, { status: 400 });
    }

    // 1) Ensure session exists (create if missing)
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
            return NextResponse.json(
                { error: "Failed to create session", details: createErr?.message ?? createErr },
                { status: 500 }
            );
        }

        sessionId = created.id;
    }

    // 2) Insert event (always)
    const { error: eventErr } = await supabase.from("chat_events").insert({
        client_id: clientId,
        session_id: sessionId,
        event_type: body.event_type,
        step_id: body.step_id ?? null,
        value: body.value ?? null,
        meta: body.meta ?? {},
    });

    if (eventErr) {
        return NextResponse.json({ error: "Failed to log event", details: eventErr.message }, { status: 500 });
    }

    // 3) Keep chat_sessions.last_step_id in sync
    if (body.step_id) {
        await supabase
            .from("chat_sessions")
            .update({ last_step_id: body.step_id })
            .eq("id", sessionId)
            .eq("client_id", clientId);
    }

    // 3b) Keep chat_sessions summary fields in sync (so Leads/Analytics don't depend on events)
    if (body.event_type === "select_inquiry") {
        const inquiry = body.value ?? null;
        await supabase
            .from("chat_sessions")
            .update({ inquiry_type: inquiry })
            .eq("id", sessionId)
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
            .eq("id", sessionId)
            .eq("client_id", clientId);
    }

    if (body.event_type === "location_submitted") {
        const meta = body.meta ?? {};
        const city = str(meta["city"]);
        const zip = str(meta["zip"]);

        await supabase
            .from("chat_sessions")
            .update({ city, zip })
            .eq("id", sessionId)
            .eq("client_id", clientId);
    }

    // ✅ Step 3B: Call clicked → call_initiated
    if (body.event_type === "call_clicked") {
        await supabase
            .from("chat_sessions")
            .update({
                outcome: "call_initiated",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("client_id", clientId);
    }

    // Optional: Text clicked (tracks intent)
    if (body.event_type === "text_clicked") {
        await supabase
            .from("chat_sessions")
            .update({
                outcome: "lead_captured",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("client_id", clientId);
    }

    // 4) contact_submitted: save lead fields + set callback_requested + ended_at + send SMS
    if (body.event_type === "contact_submitted") {
        const meta = body.meta ?? {};

        const lead_name = str(meta["lead_name"] ?? meta["name"]);
        const lead_email = str(meta["lead_email"] ?? meta["email"]);
        const preferred_contact = str(meta["preferred_contact"]);
        const lead_phone = normalizePhone(meta["lead_phone"] ?? meta["phone"]);

        // Get settings (business phone/name)
        const { data: settings } = await supabase
            .from("chatbot_settings")
            .select("business_phone, business_name")
            .eq("client_id", clientId)
            .maybeSingle();

        const businessPhone = normalizePhone(settings?.business_phone);
        const businessName = safeText(settings?.business_name) ?? "Restoration team";

        // Update session summary fields
        await supabase
            .from("chat_sessions")
            .update({
                lead_name,
                lead_phone,
                lead_email,
                preferred_contact,
                business_phone: businessPhone, // store what we used (or null)
                outcome: "callback_requested",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("client_id", clientId);

        // Read context for SMS body
        const { data: existing } = await supabase
            .from("chat_sessions")
            .select("inquiry_type, timing, is_ongoing, city, zip, damage_description")
            .eq("id", sessionId)
            .eq("client_id", clientId)
            .single();

        const inquiry = (existing?.inquiry_type ?? "not_sure").toString();
        const timing =
            typeof existing?.timing === "string" && existing.timing
                ? existing.timing
                : typeof existing?.is_ongoing === "boolean"
                    ? existing.is_ongoing
                        ? "ongoing"
                        : "stopped"
                    : "unknown";

        const loc = [existing?.city, existing?.zip].filter(Boolean).join(" ") || "—";
        const leadLine = `${lead_name ?? "—"} • ${lead_phone ?? "—"}${lead_email ? ` • ${lead_email}` : ""}`;
        const details = safeText(existing?.damage_description) ?? null;

        const businessBody =
            `New lead\n` +
            `Inquiry: ${inquiry}\n` +
            `Timing: ${timing}\n` +
            `Location: ${loc}\n` +
            `Lead: ${leadLine}\n` +
            (details ? `Details: ${details}\n` : "") +
            `Action: Call ASAP`;

        const leadBody = businessPhone
            ? `We got your request. For fastest help, call/text ${businessPhone}.\n\nSincerely,\n${businessName}`
            : `We got your request. The restoration team will reach out ASAP.\n\nSincerely,\n${businessName}`;

        // Business SMS (don’t fail ingest if Twilio fails)
        if (businessPhone) {
            try {
                const r = await sendSms({ to: businessPhone, body: businessBody });
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sessionId,
                    event_type: r.ok ? "sms_sent_business" : "sms_failed_business",
                    step_id: null,
                    value: null,
                    meta: r.ok ? { to: businessPhone, sid: r.sid } : { to: businessPhone, error: r.error },
                });
            } catch (e: any) {
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sessionId,
                    event_type: "sms_failed_business",
                    step_id: null,
                    value: null,
                    meta: { to: businessPhone, error: e?.message ?? "sendSms threw" },
                });
            }
        } else {
            await supabase.from("chat_events").insert({
                client_id: clientId,
                session_id: sessionId,
                event_type: "sms_failed_business",
                step_id: null,
                value: null,
                meta: { error: "Missing business_phone in chatbot_settings" },
            });
        }

        // Lead SMS (one-way)
        if (lead_phone) {
            try {
                const r2 = await sendSms({ to: lead_phone, body: leadBody });
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sessionId,
                    event_type: r2.ok ? "sms_sent_lead" : "sms_failed_lead",
                    step_id: null,
                    value: null,
                    meta: r2.ok ? { to: lead_phone, sid: r2.sid } : { to: lead_phone, error: r2.error },
                });
            } catch (e: any) {
                await supabase.from("chat_events").insert({
                    client_id: clientId,
                    session_id: sessionId,
                    event_type: "sms_failed_lead",
                    step_id: null,
                    value: null,
                    meta: { to: lead_phone, error: e?.message ?? "sendSms threw" },
                });
            }
        } else {
            await supabase.from("chat_events").insert({
                client_id: clientId,
                session_id: sessionId,
                event_type: "sms_failed_lead",
                step_id: null,
                value: null,
                meta: { error: "Missing lead_phone in contact_submitted meta" },
            });
        }
    }

    // 5) damage_described: store it + optionally send second SMS to business (ONLY if filled)
    if (body.event_type === "damage_described") {
        const desc = safeText(body.value);

        if (desc) {
            await supabase
                .from("chat_sessions")
                .update({ damage_description: desc })
                .eq("id", sessionId)
                .eq("client_id", clientId);

            const { data: settings } = await supabase
                .from("chatbot_settings")
                .select("business_phone")
                .eq("client_id", clientId)
                .maybeSingle();

            const businessPhone = normalizePhone(settings?.business_phone);

            if (businessPhone) {
                const detailsBody = `Lead update\nDetails: ${desc}\nSession: ${sessionId}`;
                try {
                    const r = await sendSms({ to: businessPhone, body: detailsBody });
                    await supabase.from("chat_events").insert({
                        client_id: clientId,
                        session_id: sessionId,
                        event_type: r.ok ? "sms_sent_business_details" : "sms_failed_business_details",
                        step_id: "q5_description",
                        value: null,
                        meta: r.ok ? { to: businessPhone, sid: r.sid } : { to: businessPhone, error: r.error },
                    });
                } catch (e: any) {
                    await supabase.from("chat_events").insert({
                        client_id: clientId,
                        session_id: sessionId,
                        event_type: "sms_failed_business_details",
                        step_id: "q5_description",
                        value: null,
                        meta: { to: businessPhone, error: e?.message ?? "sendSms threw" },
                    });
                }
            }
        }
    }

    return NextResponse.json({ ok: true, session_id: sessionId });
}

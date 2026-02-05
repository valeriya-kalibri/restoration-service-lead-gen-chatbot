import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms/send-sms";

type BaseEventType =
    | "select_inquiry"
    | "timing_selected"
    | "location_submitted"
    | "contact_submitted"
    | "damage_described"
    | "call_clicked"
    | "text_clicked";

type SmsEventType =
    | "sms_sent_business"
    | "sms_failed_business"
    | "sms_skipped_business"
    | "sms_sent_lead"
    | "sms_failed_lead"
    | "sms_skipped_lead"
    | "sms_sent_business_details"
    | "sms_failed_business_details"
    | "sms_skipped_business_details";

type EventType = BaseEventType | SmsEventType;

type IngestEventBody = {
    // Production identity
    widget_key?: string;

    // Session
    session_id?: string;
    event_type: BaseEventType;
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
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

function isMissingTwilioEnvError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.toLowerCase().includes("missing twilio environment variables");
}

async function logEvent(
    supabase: any,
    payload: {
        client_id: string;
        session_id: string;
        event_type: EventType;
        step_id?: string | null;
        value?: string | null;
        meta?: Record<string, unknown>;
    }
) {
    await supabase.from("chat_events").insert({
        client_id: payload.client_id,
        session_id: payload.session_id,
        event_type: payload.event_type,
        step_id: payload.step_id ?? null,
        value: payload.value ?? null,
        meta: payload.meta ?? {},
    });
}

async function resolveClientFromWidgetKey(supabase: any, widgetKey: string) {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, widget_enabled, business_phone, business_name")
        .eq("widget_key", widgetKey)
        .maybeSingle();

    if (error) {
        return { ok: false as const, status: 500, error: error.message };
    }
    if (!profile) {
        return { ok: false as const, status: 404, error: "Invalid widget_key" };
    }

    return {
        ok: true as const,
        clientId: profile.id as string,
        widgetEnabled: (profile.widget_enabled as boolean | null) !== false,
        businessPhone: normalizePhone(profile.business_phone),
        businessName: safeText(profile.business_name) ?? "Restoration team",
    };
}

export async function POST(req: Request) {
    const supabase = await createClient();

    let body: IngestEventBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.event_type) {
        return NextResponse.json({ error: "event_type is required" }, { status: 400 });
    }

    // Resolve client identity:
    // - If logged in (dashboard test), use auth user id
    // - Else production requires widget_key
    const { data: userData } = await supabase.auth.getUser();
    const authedUserId = userData?.user?.id ?? null;

    let clientId: string | null = authedUserId;

    // For production (no auth), we must resolve by widget_key
    const widgetKey = safeText(body.widget_key) ?? null;
    let cachedConfig:
        | { widgetEnabled: boolean; businessPhone: string | null; businessName: string }
        | null = null;

    if (!clientId) {
        if (!widgetKey) {
            return NextResponse.json({ error: "widget_key is required (production mode)" }, { status: 401 });
        }

        const resolved = await resolveClientFromWidgetKey(supabase, widgetKey);
        if (!resolved.ok) {
            return NextResponse.json({ error: resolved.error }, { status: resolved.status });
        }

        clientId = resolved.clientId;
        cachedConfig = {
            widgetEnabled: resolved.widgetEnabled,
            businessPhone: resolved.businessPhone,
            businessName: resolved.businessName,
        };
    }

    // Extra guard
    if (!clientId) {
        return NextResponse.json({ error: "Unable to resolve client" }, { status: 500 });
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

    if (!sessionId) {
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    const sid = sessionId;

    // 2) Insert base event (always)
    const { error: eventErr } = await supabase.from("chat_events").insert({
        client_id: clientId,
        session_id: sid,
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
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // 3b) Keep chat_sessions summary fields in sync
    if (body.event_type === "select_inquiry") {
        const inquiry = body.value ?? null;
        await supabase.from("chat_sessions").update({ inquiry_type: inquiry }).eq("id", sid).eq("client_id", clientId);
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

    if (body.event_type === "location_submitted") {
        const meta = body.meta ?? {};
        const city = str(meta["city"]);
        const zip = str(meta["zip"]);

        await supabase.from("chat_sessions").update({ city, zip }).eq("id", sid).eq("client_id", clientId);
    }

    // Call clicked → call_initiated
    if (body.event_type === "call_clicked") {
        await supabase
            .from("chat_sessions")
            .update({ outcome: "call_initiated", ended_at: new Date().toISOString() })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // Text clicked (tracks intent)
    if (body.event_type === "text_clicked") {
        await supabase
            .from("chat_sessions")
            .update({ outcome: "lead_captured", ended_at: new Date().toISOString() })
            .eq("id", sid)
            .eq("client_id", clientId);
    }

    // 4) contact_submitted: save lead fields + set callback_requested + ended_at + send SMS (non-fatal)
    if (body.event_type === "contact_submitted") {
        const meta = body.meta ?? {};

        const lead_name = str(meta["lead_name"] ?? meta["name"]);
        const lead_email = str(meta["lead_email"] ?? meta["email"]);
        const preferred_contact = str(meta["preferred_contact"]);
        const lead_phone = normalizePhone(meta["lead_phone"] ?? meta["phone"]);

        // Get client config from profiles (source of truth)
        // If we already resolved via widget_key, reuse cached config.
        let widgetEnabled = cachedConfig?.widgetEnabled ?? true;
        let businessPhone = cachedConfig?.businessPhone ?? null;
        let businessName = cachedConfig?.businessName ?? "Restoration team";

        if (!cachedConfig) {
            const { data: settings } = await supabase
                .from("profiles")
                .select("business_phone, business_name, widget_enabled")
                .eq("id", clientId)
                .maybeSingle();

            widgetEnabled = settings?.widget_enabled !== false;
            businessPhone = normalizePhone(settings?.business_phone);
            businessName = safeText(settings?.business_name) ?? "Restoration team";
        }

        // Update session summary fields (always)
        await supabase
            .from("chat_sessions")
            .update({
                lead_name,
                lead_phone,
                lead_email,
                preferred_contact,
                business_phone: businessPhone,
                outcome: "callback_requested",
                ended_at: new Date().toISOString(),
            })
            .eq("id", sid)
            .eq("client_id", clientId);

        // Read context for SMS body
        const { data: existing } = await supabase
            .from("chat_sessions")
            .select("inquiry_type, timing, is_ongoing, city, zip, damage_description")
            .eq("id", sid)
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

        // Widget disabled: skip SMS but keep session captured
        if (!widgetEnabled) {
            await logEvent(supabase, {
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_business",
                meta: { reason: "Widget disabled in profiles" },
            });

            await logEvent(supabase, {
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_lead",
                meta: { reason: "Widget disabled in profiles" },
            });

            return NextResponse.json({ ok: true, session_id: sid });
        }

        // Business SMS (optional, non-fatal)
        if (!businessPhone) {
            await logEvent(supabase, {
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_business",
                meta: { reason: "Missing business_phone in profiles" },
            });
        } else {
            try {
                const msg = await sendSms(businessPhone, businessBody);
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_sent_business",
                    meta: { to: businessPhone, sid: (msg as any)?.sid ?? null },
                });
            } catch (e: any) {
                const skipped = isMissingTwilioEnvError(e);
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: skipped ? "sms_skipped_business" : "sms_failed_business",
                    meta: {
                        to: businessPhone,
                        error: e?.message ?? "sendSms threw",
                        reason: skipped ? "Twilio not configured" : undefined,
                    },
                });
            }
        }

        // Lead SMS (one-way, optional, non-fatal)
        if (!lead_phone) {
            await logEvent(supabase, {
                client_id: clientId,
                session_id: sid,
                event_type: "sms_skipped_lead",
                meta: { reason: "Missing lead_phone in contact_submitted meta" },
            });
        } else {
            try {
                const msg2 = await sendSms(lead_phone, leadBody);
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_sent_lead",
                    meta: { to: lead_phone, sid: (msg2 as any)?.sid ?? null },
                });
            } catch (e: any) {
                const skipped = isMissingTwilioEnvError(e);
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: skipped ? "sms_skipped_lead" : "sms_failed_lead",
                    meta: {
                        to: lead_phone,
                        error: e?.message ?? "sendSms threw",
                        reason: skipped ? "Twilio not configured" : undefined,
                    },
                });
            }
        }
    }

    // 5) damage_described: store it + optionally send second SMS to business (ONLY if filled)
    if (body.event_type === "damage_described") {
        const desc = safeText(body.value);

        if (desc) {
            await supabase.from("chat_sessions").update({ damage_description: desc }).eq("id", sid).eq("client_id", clientId);

            // Get client config from profiles (source of truth)
            let widgetEnabled = cachedConfig?.widgetEnabled ?? true;
            let businessPhone = cachedConfig?.businessPhone ?? null;

            if (!cachedConfig) {
                const { data: settings } = await supabase
                    .from("profiles")
                    .select("business_phone, widget_enabled")
                    .eq("id", clientId)
                    .maybeSingle();

                widgetEnabled = settings?.widget_enabled !== false;
                businessPhone = normalizePhone(settings?.business_phone);
            }

            if (!widgetEnabled) {
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_skipped_business_details",
                    step_id: "q5_description",
                    meta: { reason: "Widget disabled in profiles" },
                });

                return NextResponse.json({ ok: true, session_id: sid });
            }

            if (!businessPhone) {
                await logEvent(supabase, {
                    client_id: clientId,
                    session_id: sid,
                    event_type: "sms_skipped_business_details",
                    step_id: "q5_description",
                    meta: { reason: "Missing business_phone in profiles" },
                });
            } else {
                const detailsBody = `Lead update\nDetails: ${desc}\nSession: ${sid}`;
                try {
                    const msg = await sendSms(businessPhone, detailsBody);
                    await logEvent(supabase, {
                        client_id: clientId,
                        session_id: sid,
                        event_type: "sms_sent_business_details",
                        step_id: "q5_description",
                        meta: { to: businessPhone, sid: (msg as any)?.sid ?? null },
                    });
                } catch (e: any) {
                    const skipped = isMissingTwilioEnvError(e);
                    await logEvent(supabase, {
                        client_id: clientId,
                        session_id: sid,
                        event_type: skipped
                            ? "sms_skipped_business_details"
                            : "sms_failed_business_details",
                        step_id: "q5_description",
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

    // Default response for all other events
    return NextResponse.json({ ok: true, session_id: sid });
}

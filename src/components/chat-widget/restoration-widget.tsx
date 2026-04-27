"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Inquiry = "water" | "fire" | "mold" | "not_sure";
type Timing = "ongoing" | "stopped";
type WidgetMode = "demo" | "live";
type WidgetVariant = "floating" | "embedded";

type Props = {
    mode?: WidgetMode;
    variant?: WidgetVariant;
    widgetKey?: string;
    ingestUrl?: string;
    configUrl?: string;
};

type StepId =
    | "q1_inquiry"
    | "q2_timing"
    | "q3_location"
    | "q4_contact"
    | "q5_description"
    | "done";

type Message = { id: string; role: "bot" | "user"; text: string };

function cx(...a: Array<string | false | undefined | null>) {
    return a.filter(Boolean).join(" ");
}

function safeText(x: unknown): string | null {
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

function formatPhoneForDisplay(e164: string | null) {
    if (!e164) return null;
    const digits = e164.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) {
        const a = digits.slice(1, 4);
        const b = digits.slice(4, 7);
        const c = digits.slice(7, 11);
        return `(${a}) ${b}-${c}`;
    }
    return e164;
}

function getOrCreateVisitorId(): string {
    if (typeof window === "undefined") return "unknown";
    const key = "kalibri_visitor_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `v_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    window.localStorage.setItem(key, id);
    return id;
}

const INIT_MESSAGE: Message = {
    id: "init",
    role: "bot",
    text: "Hi! I'm here to help connect you with emergency restoration services — fast. What type of damage are you dealing with?",
};

export function RestorationWidget({
    mode = "demo",
    variant = "floating",
    widgetKey,
    ingestUrl = "/api/chat/ingest",
    configUrl = "/api/chat/config",
}: Props) {
    const [open, setOpen] = React.useState(true);
    const [step, setStep] = React.useState<StepId>("q1_inquiry");
    const [sessionId, setSessionId] = React.useState<string | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([INIT_MESSAGE]);

    const [inquiry, setInquiry] = React.useState<Inquiry | null>(null);
    const [timing, setTiming] = React.useState<Timing | null>(null);
    const [city, setCity] = React.useState("");
    const [zip, setZip] = React.useState("");
    const [name, setName] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [description, setDescription] = React.useState("");

    const [businessPhone, setBusinessPhone] = React.useState<string | null>(null);
    const [widgetEnabled, setWidgetEnabled] = React.useState<boolean>(true);
    const [businessName, setBusinessName] = React.useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = React.useState<string>("#6D72A8");

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const bottomRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (variant === "embedded") setOpen(true);
    }, [variant]);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, busy]);

    React.useEffect(() => {
        if (mode !== "live") return;
        if (!widgetKey) { setWidgetEnabled(false); return; }
        let cancelled = false;
        (async () => {
            try {
                const url = new URL(configUrl, window.location.origin);
                url.searchParams.set("key", widgetKey);
                const res = await fetch(url.toString(), { method: "GET", headers: { accept: "application/json" } });
                const json = await res.json().catch(() => ({} as any));
                if (cancelled) return;
                if (!res.ok || json?.ok !== true) { setWidgetEnabled(false); return; }
                setBusinessPhone(typeof json?.business_phone === "string" ? json.business_phone : null);
                setBusinessName(typeof json?.business_name === "string" ? json.business_name : null);
                setWidgetEnabled(json?.widget_enabled !== false);
                setPrimaryColor(typeof json?.primary_color === "string" ? json.primary_color : "#6D72A8");
            } catch { if (!cancelled) setWidgetEnabled(false); }
        })();
        return () => { cancelled = true; };
    }, [mode, configUrl, widgetKey]);

    function push(...msgs: Message[]) {
        setMessages(p => [...p, ...msgs]);
    }

    function uid() { return `${Date.now()}_${Math.random().toString(16).slice(2)}`; }

    async function ingest(event_type: string, payload?: { step_id?: string; value?: string; meta?: any }) {
        if (mode === "demo") return;
        const visitor_id = getOrCreateVisitorId();
        const body: any = {
            key: widgetKey ?? undefined,
            session_id: sessionId ?? undefined,
            event_type,
            step_id: payload?.step_id,
            value: payload?.value,
            meta: payload?.meta ?? undefined,
            session: sessionId ? undefined : {
                page_url: typeof window !== "undefined" ? window.location.href : undefined,
                referrer: typeof document !== "undefined" ? document.referrer : undefined,
                visitor_id,
            },
        };
        const res = await fetch(ingestUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(json?.error ?? "Failed to ingest");
        if (json?.session_id && !sessionId) setSessionId(json.session_id);
    }

    function reset() {
        setSessionId(null);
        setStep("q1_inquiry");
        setInquiry(null);
        setTiming(null);
        setCity(""); setZip(""); setName(""); setPhone(""); setEmail(""); setDescription("");
        setError(null);
        setMessages([INIT_MESSAGE]);
    }

    async function onSelectInquiry(x: Inquiry) {
        setError(null);
        setInquiry(x);
        const label = { water: "Water damage", fire: "Fire damage", mold: "Mold", not_sure: "Not sure / other" }[x];
        push(
            { id: uid(), role: "user", text: label },
            { id: uid(), role: "bot", text: "Got it. Is this still happening right now, or has it stopped?" }
        );
        try {
            setBusy(true);
            await ingest("select_inquiry", { step_id: "q1_inquiry", value: x });
            setStep("q2_timing");
        } catch (e: any) { setError(e?.message ?? "Failed"); }
        finally { setBusy(false); }
    }

    async function onSelectTiming(x: Timing) {
        setError(null);
        setTiming(x);
        const label = x === "ongoing" ? "Happening right now" : "Already stopped";
        push(
            { id: uid(), role: "user", text: label },
            { id: uid(), role: "bot", text: "Understood. What city and ZIP code are you in?" }
        );
        try {
            setBusy(true);
            await ingest("timing_selected", { step_id: "q2_timing", value: x });
            setStep("q3_location");
        } catch (e: any) { setError(e?.message ?? "Failed"); }
        finally { setBusy(false); }
    }

    async function onSubmitLocation() {
        setError(null);
        const c = city.trim();
        const z = zip.trim();
        if (!c || !z) { setError("Please enter city and ZIP."); return; }
        push(
            { id: uid(), role: "user", text: `${c}, ${z}` },
            { id: uid(), role: "bot", text: "Perfect. How can we reach you? I just need your name and phone number." }
        );
        try {
            setBusy(true);
            await ingest("location_submitted", { step_id: "q3_location", meta: { city: c, zip: z } });
            setStep("q4_contact");
        } catch (e: any) { setError(e?.message ?? "Failed"); }
        finally { setBusy(false); }
    }

    async function onSubmitContact() {
        setError(null);
        const n = name.trim();
        const p = phone.trim();
        const em = email.trim();
        if (!n || !p) { setError("Name and phone are required."); return; }
        push(
            { id: uid(), role: "user", text: em ? `${n} · ${p} · ${em}` : `${n} · ${p}` },
            { id: uid(), role: "bot", text: "Almost done! Can you briefly describe what happened? (Optional — helps the team prepare before they call.)" }
        );
        try {
            setBusy(true);
            await ingest("contact_submitted", { step_id: "q4_contact", meta: { lead_name: n, lead_phone: p, lead_email: em || null, city: city.trim() || null, zip: zip.trim() || null, preferred_contact: "either" } });
            setStep("q5_description");
        } catch (e: any) { setError(e?.message ?? "Failed"); }
        finally { setBusy(false); }
    }

    async function onSubmitDescription() {
        setError(null);
        const d = description.trim();
        if (d) push({ id: uid(), role: "user", text: d });
        push({ id: uid(), role: "bot", text: "✓ Your request has been received! The restoration team is being alerted now. For the fastest response, call or text directly." });
        try {
            if (d) { setBusy(true); await ingest("damage_described", { step_id: "q5_description", value: d }); }
            setStep("done");
        } catch (e: any) { setError(e?.message ?? "Failed"); }
        finally { setBusy(false); }
    }

    function onSkipDescription() {
        setError(null);
        push({ id: uid(), role: "bot", text: "✓ Your request has been received! The restoration team is being alerted now. For the fastest response, call or text directly." });
        setStep("done");
    }

    const canCallText = widgetEnabled && !!businessPhone;

    const primary = { backgroundColor: primaryColor, borderColor: primaryColor, color: "#fff" };
    const primaryOutline = { borderColor: primaryColor, color: primaryColor, backgroundColor: "transparent" };

    const wrapperClass = variant === "floating" ? "fixed bottom-4 right-4 z-50" : "w-full";
    const cardClass = cx(
        "flex flex-col rounded-2xl overflow-hidden shadow-xl border border-border/60",
        variant === "floating" ? "w-[360px]" : "w-full",
        variant === "floating" && !open && "hidden"
    );

    return (
        <div className={wrapperClass} style={{ "--widget-primary": primaryColor } as React.CSSProperties}>
            <div className={cardClass}>

                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: primaryColor }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/kalibri-logo512.png" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white">Emergency Assistant</div>
                        <div className="flex items-center gap-1.5 text-xs text-white/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                            Online now
                        </div>
                    </div>
                    {variant === "floating" && (
                        <button
                            className="shrink-0 text-white/70 hover:text-white transition-colors"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* ── Chat messages ── */}
                <div className="h-[240px] overflow-y-auto bg-gray-50/60 px-4 py-4 space-y-3">
                    {messages.map(msg => (
                        <div key={msg.id} className={cx("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                            {msg.role === "bot" && (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/images/kalibri-logo512.png" alt="" width={13} height={13} style={{ filter: "invert(1)" }} />
                                </div>
                            )}
                            <div
                                className={cx(
                                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                                    msg.role === "bot"
                                        ? "rounded-bl-none bg-white shadow-sm text-foreground"
                                        : "rounded-br-none text-white"
                                )}
                                style={msg.role === "user" ? { backgroundColor: primaryColor } : undefined}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {busy && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/kalibri-logo512.png" alt="" width={13} height={13} style={{ filter: "invert(1)" }} />
                            </div>
                            <div className="rounded-2xl rounded-bl-none bg-white shadow-sm px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* ── Input area ── */}
                <div className="border-t bg-white px-4 py-3 space-y-2">
                    {error && (
                        <div className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{error}</div>
                    )}

                    {step === "q1_inquiry" && (
                        <div className="flex flex-wrap gap-2">
                            {(["water", "fire", "mold", "not_sure"] as Inquiry[]).map(val => {
                                const label = { water: "Water damage", fire: "Fire damage", mold: "Mold", not_sure: "Not sure / other" }[val];
                                return (
                                    <button
                                        key={val}
                                        disabled={busy}
                                        onClick={() => onSelectInquiry(val)}
                                        className={`rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${inquiry === val ? "kw-btn" : "kw-btn-outline"}`}
                                        style={inquiry === val ? primary : primaryOutline}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === "q2_timing" && (
                        <div className="flex flex-wrap gap-2">
                            {([["ongoing", "Happening right now"], ["stopped", "Already stopped"]] as [Timing, string][]).map(([val, label]) => (
                                <button
                                    key={val}
                                    disabled={busy}
                                    onClick={() => onSelectTiming(val)}
                                    className={`rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${timing === val ? "kw-btn" : "kw-btn-outline"}`}
                                    style={timing === val ? primary : primaryOutline}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {step === "q3_location" && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                                    placeholder="City"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    disabled={busy}
                                />
                                <input
                                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                                    placeholder="ZIP"
                                    value={zip}
                                    onChange={e => setZip(e.target.value)}
                                    disabled={busy}
                                />
                            </div>
                            <button
                                disabled={busy}
                                onClick={onSubmitLocation}
                                className="w-full rounded-lg py-2 text-sm font-semibold kw-btn disabled:opacity-50"
                                style={primary}
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === "q4_contact" && (
                        <div className="space-y-2">
                            <input className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Full name (required)" value={name} onChange={e => setName(e.target.value)} disabled={busy} />
                            <input className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Phone (required)" value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} />
                            <input className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
                            <button disabled={busy} onClick={onSubmitContact} className="w-full rounded-lg py-2 text-sm font-semibold kw-btn disabled:opacity-50" style={primary}>
                                Continue
                            </button>
                        </div>
                    )}

                    {step === "q5_description" && (
                        <div className="space-y-2">
                            <textarea
                                className="min-h-[72px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
                                placeholder="Pipe burst under sink, water spreading into hallway…"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={busy}
                            />
                            <div className="flex gap-2">
                                <button disabled={busy} onClick={onSubmitDescription} className="flex-1 rounded-lg py-2 text-sm font-semibold kw-btn disabled:opacity-50" style={primary}>
                                    Submit
                                </button>
                                <button disabled={busy} onClick={onSkipDescription} className="rounded-lg border px-4 py-2 text-sm font-medium kw-btn-outline disabled:opacity-50" style={primaryOutline}>
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "done" && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" style={primary} className="border-0">
                                    <a href={canCallText ? `tel:${businessPhone}` : "#"} onClick={async e => { if (!canCallText) { e.preventDefault(); return; } try { await ingest("call_clicked", { step_id: "done", value: "call_initiated" }); } catch { } }}>
                                        Call now
                                    </a>
                                </Button>
                                <Button asChild size="sm" variant="outline" style={primaryOutline} className="kw-btn-outline">
                                    <a href={canCallText ? `sms:${businessPhone}` : "#"} onClick={async e => { if (!canCallText) { e.preventDefault(); return; } try { await ingest("text_clicked", { step_id: "done", value: "text_initiated" }); } catch { } }}>
                                        Text us
                                    </a>
                                </Button>
                                {variant === "embedded" && (
                                    <Button size="sm" variant="outline" onClick={reset} style={primaryOutline} className="kw-btn-outline">
                                        Start over
                                    </Button>
                                )}
                            </div>
                            {mode === "demo" && (
                                <p className="text-xs text-muted-foreground">Demo mode — Call/Text are preview only.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {variant === "floating" && !open && (
                <button
                    onClick={() => setOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg text-white kw-btn"
                    style={{ backgroundColor: primaryColor }}
                    aria-label="Open chat"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
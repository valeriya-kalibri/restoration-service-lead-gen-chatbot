"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Inquiry = "water" | "fire" | "mold" | "not_sure";
type Timing = "ongoing" | "stopped";

type WidgetMode = "demo" | "live";
type WidgetVariant = "floating" | "embedded";

type Props = {
    mode?: WidgetMode; // demo = no API calls, live = ingest events
    variant?: WidgetVariant; // floating = bottom-right widget, embedded = inline block

    // Identity / config
    widgetKey?: string;

    // API endpoints (override-able for iframe / multi-tenant)
    ingestUrl?: string; // default: /api/chat/ingest
    configUrl?: string; // default: /api/chat/get-business-phone
};

type StepId = "q1_inquiry" | "q2_timing" | "q3_location" | "q4_contact" | "done";

function cx(...a: Array<string | false | undefined | null>) {
    return a.filter(Boolean).join(" ");
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

export function RestorationWidget({
    mode = "demo",
    variant = "floating",
    widgetKey,
    ingestUrl = "/api/chat/ingest",
    configUrl = "/api/chat/get-business-phone",
}: Props) {
    // Floating widget can be closed; embedded should always be visible.
    const [open, setOpen] = React.useState(true);

    const [step, setStep] = React.useState<StepId>("q1_inquiry");
    const [sessionId, setSessionId] = React.useState<string | null>(null);

    const [inquiry, setInquiry] = React.useState<Inquiry | null>(null);
    const [timing, setTiming] = React.useState<Timing | null>(null);
    const [city, setCity] = React.useState("");
    const [zip, setZip] = React.useState("");
    const [name, setName] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [email, setEmail] = React.useState("");

    const [businessPhone, setBusinessPhone] = React.useState<string | null>(null);

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Force embedded widget to always show (no launcher UX)
    React.useEffect(() => {
        if (variant === "embedded") setOpen(true);
    }, [variant]);

    // Live mode: fetch business phone for Call/Text CTA (demo does NOT fetch)
    React.useEffect(() => {
        if (mode !== "live") return;

        (async () => {
            try {
                const url = new URL(configUrl, window.location.origin);
                if (widgetKey) url.searchParams.set("key", widgetKey);

                const res = await fetch(url.toString(), { method: "GET" });
                const json = await res.json().catch(() => ({}));
                if (res.ok && typeof json?.business_phone === "string" && json.business_phone.trim()) {
                    setBusinessPhone(json.business_phone);
                } else {
                    setBusinessPhone(null);
                }
            } catch {
                setBusinessPhone(null);
            }
        })();
    }, [mode, configUrl, widgetKey]);

    async function ingest(event_type: string, payload?: { step_id?: string; value?: string; meta?: any }) {
        if (mode === "demo") return;

        const body: any = {
            session_id: sessionId ?? undefined,
            event_type,
            step_id: payload?.step_id,
            value: payload?.value,
            meta: payload?.meta ?? undefined,
            widget_key: widgetKey ?? undefined,
            session: sessionId
                ? undefined
                : {
                    page_url: typeof window !== "undefined" ? window.location.href : undefined,
                    referrer: typeof document !== "undefined" ? document.referrer : undefined,
                },
        };

        const res = await fetch(ingestUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to ingest");
        if (json?.session_id && !sessionId) setSessionId(json.session_id);
    }

    function reset() {
        setSessionId(null);
        setStep("q1_inquiry");
        setInquiry(null);
        setTiming(null);
        setCity("");
        setZip("");
        setName("");
        setPhone("");
        setEmail("");
        setError(null);
    }

    async function onSelectInquiry(x: Inquiry) {
        setError(null);
        setInquiry(x);
        try {
            setBusy(true);
            await ingest("select_inquiry", { step_id: "q1_inquiry", value: x });
            setStep("q2_timing");
        } catch (e: any) {
            setError(e?.message ?? "Failed");
        } finally {
            setBusy(false);
        }
    }

    async function onSelectTiming(x: Timing) {
        setError(null);
        setTiming(x);
        try {
            setBusy(true);
            await ingest("timing_selected", { step_id: "q2_timing", value: x });
            setStep("q3_location");
        } catch (e: any) {
            setError(e?.message ?? "Failed");
        } finally {
            setBusy(false);
        }
    }

    async function onSubmitLocation() {
        setError(null);
        const c = city.trim();
        const z = zip.trim();
        if (!c || !z) {
            setError("Please enter city and ZIP.");
            return;
        }
        try {
            setBusy(true);
            await ingest("location_submitted", { step_id: "q3_location", meta: { city: c, zip: z } });
            setStep("q4_contact");
        } catch (e: any) {
            setError(e?.message ?? "Failed");
        } finally {
            setBusy(false);
        }
    }

    async function onSubmitContact() {
        setError(null);
        const n = name.trim();
        const p = phone.trim();
        const em = email.trim();

        if (!n || !p) {
            setError("Name and phone are required.");
            return;
        }

        try {
            setBusy(true);
            await ingest("contact_submitted", {
                step_id: "q4_contact",
                meta: {
                    lead_name: n,
                    lead_phone: p,
                    lead_email: em || null,
                    city: city.trim() || null,
                    zip: zip.trim() || null,
                    preferred_contact: "either",
                },
            });
            setStep("done");
        } catch (e: any) {
            setError(e?.message ?? "Failed");
        } finally {
            setBusy(false);
        }
    }

    const headerText = step === "done" ? "Request received" : "Fast emergency help";

    // Layout: floating vs embedded
    const wrapperClass = variant === "floating" ? "fixed bottom-4 right-4 z-50" : "w-full flex justify-center";

    const cardClass =
        variant === "floating"
            ? "w-[360px] rounded-2xl border bg-background shadow-lg"
            : "w-full max-w-[420px] rounded-2xl border bg-background shadow-lg";

    return (
        <div className={wrapperClass}>
            <div className={cx(cardClass, variant === "floating" && !open && "hidden")}>
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="text-sm font-semibold">{headerText}</div>

                    {variant === "floating" ? (
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </button>
                    ) : null}
                </div>

                <div className="px-4 py-3 space-y-3">
                    {/* Q1 */}
                    {step === "q1_inquiry" ? (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Hi — I’m [Company Name]’s emergency assistant.
                                <br />
                                My job is to get the right help to you as quickly as possible.
                            </p>

                            <div className="text-sm font-medium">What happened?</div>

                            <div className="flex flex-wrap gap-2">
                                <Button disabled={busy} variant="outline" onClick={() => onSelectInquiry("water")}>
                                    Water damage
                                </Button>
                                <Button disabled={busy} variant="outline" onClick={() => onSelectInquiry("fire")}>
                                    Fire damage
                                </Button>
                                <Button disabled={busy} variant="outline" onClick={() => onSelectInquiry("mold")}>
                                    Mold
                                </Button>
                                <Button disabled={busy} variant="outline" onClick={() => onSelectInquiry("not_sure")}>
                                    Not sure / other
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {/* Q2 */}
                    {step === "q2_timing" ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Is the problem happening right now, or has it already stopped?
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button disabled={busy} variant="outline" onClick={() => onSelectTiming("ongoing")}>
                                    Happening now
                                </Button>
                                <Button disabled={busy} variant="outline" onClick={() => onSelectTiming("stopped")}>
                                    Already stopped
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {/* Q3 */}
                    {step === "q3_location" ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Where are you located?</div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={busy}
                                />
                                <input
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    placeholder="ZIP"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    disabled={busy}
                                />
                            </div>
                            <Button disabled={busy} onClick={onSubmitLocation}>
                                Continue
                            </Button>
                        </div>
                    ) : null}

                    {/* Q4 */}
                    {step === "q4_contact" ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">How can we reach you?</div>
                            <div className="space-y-2">
                                <input
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={busy}
                                />
                                <input
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    placeholder="Phone (required)"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={busy}
                                />
                                <input
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    placeholder="Email (optional)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={busy}
                                />
                            </div>

                            <div className="text-xs text-muted-foreground">
                                We’ll text you a confirmation and the business will reach out ASAP.
                            </div>

                            <Button disabled={busy} onClick={onSubmitContact}>
                                Submit
                            </Button>
                        </div>
                    ) : null}

                    {/* DONE */}
                    {step === "done" ? (
                        <div className="space-y-3">
                            <div className="text-sm font-medium">Request received — help is being alerted</div>

                            <div className="text-sm text-muted-foreground">
                                Thanks — we’ve sent your details to the restoration team and they’re being notified now.
                                <br />
                                For the fastest response,{" "}
                                <span className="font-medium text-foreground">call or text the business directly</span>
                                {businessPhone ? (
                                    <>
                                        {" "}
                                        at{" "}
                                        <span className="font-medium text-foreground">
                                            {formatPhoneForDisplay(businessPhone)}
                                        </span>
                                        .
                                    </>
                                ) : (
                                    "."
                                )}
                                <div className="mt-2">
                                    If you don’t reach someone right away, they’ll follow up as soon as possible.
                                </div>
                            </div>

                            {/* Demo preview note ONLY */}
                            {mode === "demo" ? (
                                <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-2">
                                    <div className="font-medium text-foreground">Demo preview</div>
                                    <div className="text-xs text-muted-foreground">
                                        Demo mode: Call/Text buttons are preview-only. Live mode uses the business number
                                        from Settings.
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                {/* CALL */}
                                <Button asChild>
                                    <a
                                        href={businessPhone ? `tel:${businessPhone}` : "#"}
                                        onClick={async (e) => {
                                            if (!businessPhone) {
                                                e.preventDefault();
                                                return;
                                            }
                                            try {
                                                await ingest("call_clicked", {
                                                    step_id: "done",
                                                    value: "call_initiated",
                                                });
                                            } catch { }
                                        }}
                                    >
                                        Call the business
                                    </a>
                                </Button>

                                {/* TEXT */}
                                <Button asChild variant="outline">
                                    <a
                                        href={businessPhone ? `sms:${businessPhone}` : "#"}
                                        onClick={(e) => !businessPhone && e.preventDefault()}
                                    >
                                        Text the business
                                    </a>
                                </Button>

                                {/* Embedded gets reset button; floating gets close */}
                                {variant === "embedded" ? (
                                    <Button variant="outline" onClick={reset}>
                                        Start over
                                    </Button>
                                ) : null}

                                {variant === "floating" ? (
                                    <Button variant="outline" onClick={() => setOpen(false)}>
                                        Close
                                    </Button>
                                ) : null}
                            </div>

                            {!businessPhone ? (
                                <div className="text-xs text-muted-foreground">
                                    Add your business phone in <span className="font-medium">Settings</span> to enable
                                    Call/Text.
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Debug */}
                    <div className="pt-2 text-[11px] text-muted-foreground">
                        Mode: <span className="font-mono">{mode}</span>
                        {sessionId ? (
                            <>
                                {" "}
                                • Session: <span className="font-mono">{sessionId}</span>
                            </>
                        ) : null}
                    </div>

                    {error ? <div className="text-sm text-destructive">{error}</div> : null}
                </div>
            </div>

            {/* Floating-only launcher */}
            {variant === "floating" && !open ? (
                <Button className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
                    Chat
                </Button>
            ) : null}
        </div>
    );
}

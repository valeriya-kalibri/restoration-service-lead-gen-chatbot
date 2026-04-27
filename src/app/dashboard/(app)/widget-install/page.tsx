import { redirect } from "next/navigation";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { EmbedCodeBlock } from "@/components/chat-widget/embed-code-block";
import { PlatformSteps } from "./_components/platform-steps";
import { Code2, CheckCircle2 } from "lucide-react";

function safeStr(x: unknown) {
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

function getBaseUrl() {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
    if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
    const vercel = process.env.VERCEL_URL;
    if (vercel) return `https://${vercel}`.replace(/\/$/, "");
    return "http://localhost:3000";
}

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold mt-0.5">
                {step}
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

export default async function WidgetInstallPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/");

    const clientId = auth.user.id;

    const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, widget_key")
        .eq("id", clientId)
        .maybeSingle();

    const businessName = safeStr(profile?.business_name) ?? "your business";

    let widgetKey = safeStr(profile?.widget_key);
    if (!widgetKey) {
        widgetKey = crypto.randomUUID();
        await supabase.from("profiles").update({ widget_key: widgetKey }).eq("id", clientId);
    }

    const baseUrl = getBaseUrl();

    const embedCode = `<!-- Kalibri Restoration Lead Widget -->
<div id="kalibri-restoration-widget"></div>

<script
  src="${baseUrl}/widget/kalibri-restoration-widget.js?key=${widgetKey}"
  defer
></script>`;

    return (
        <div className="space-y-5">
            {/* Banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Installation
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Widget Install</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Add the lead capture chatbot to{" "}
                        <span className="font-semibold text-white">{businessName}</span>'s website — takes about 5 minutes.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Code2 className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Step 1 — Copy code */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={1}
                    title="Copy your embed code"
                    subtitle="This code is unique to your account — it links the widget to your dashboard."
                />
                <EmbedCodeBlock code={embedCode} />
            </div>

            {/* Step 2 — Platform instructions */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={2}
                    title="Add it to your website"
                    subtitle="Select your website platform below for step-by-step instructions."
                />
                <PlatformSteps />
            </div>

            {/* Step 3 — Verify */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={3}
                    title="Verify it's working"
                    subtitle="Confirm the widget is live and capturing leads correctly."
                />
                <div className="space-y-3">
                    {[
                        "Open your website in a new browser tab.",
                        "Look for the chat bubble in the bottom-right corner of the page — it should appear within a few seconds.",
                        "Click the bubble and complete a short test conversation.",
                        "Come back here and check Chat Logs — your test session should appear within a minute.",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                        </div>
                    ))}

                    <div className="mt-4 rounded-xl border bg-white px-4 py-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Not seeing the bubble?</span>{" "}
                        Double-check the code was saved and the page was published. Clear your browser cache and try again. If it still doesn't appear, contact{" "}
                        <span className="font-medium text-foreground">support@kalibristudios.ai</span>.
                    </div>
                </div>
            </div>
        </div>
    );
}
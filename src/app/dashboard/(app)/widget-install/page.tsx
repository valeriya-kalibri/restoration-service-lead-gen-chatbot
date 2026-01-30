import { redirect } from "next/navigation";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { EmbedCodeBlock } from "@/components/chat-widget/embed-code-block";

function safeStr(x: unknown) {
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

function getBaseUrl() {
    // ✅ You should set NEXT_PUBLIC_APP_URL in .env.local and in Vercel env vars.
    // Example: https://your-vercel-app.vercel.app
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
    if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");

    // Fallback for Vercel (server-side only)
    const vercel = process.env.VERCEL_URL;
    if (vercel) return `https://${vercel}`.replace(/\/$/, "");

    // Local fallback
    return "http://localhost:3000";
}

export default async function WidgetInstallPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/");

    const clientId = auth.user.id;

    // Friendly business name (optional)
    const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", clientId)
        .maybeSingle();

    const businessName = safeStr(profile?.business_name) ?? "your business";

    // Ensure chatbot_settings exists + has widget_key
    const { data: existingSettings, error: settingsReadErr } = await supabase
        .from("chatbot_settings")
        .select("client_id, widget_key")
        .eq("client_id", clientId)
        .maybeSingle();

    if (settingsReadErr) {
        // If this fails, it’s usually RLS/policy or table mismatch
        // Keep it simple for now: just show page without embed.
    }

    let widgetKey = safeStr(existingSettings?.widget_key);

    if (!widgetKey) {
        widgetKey = crypto.randomUUID();

        // Upsert so first-time users don’t break
        await supabase
            .from("chatbot_settings")
            .upsert(
                { client_id: clientId, widget_key: widgetKey },
                { onConflict: "client_id" }
            );
    }

    const baseUrl = getBaseUrl();

    // ✅ This is what the client copies.
    // They do NOT need to understand the key — it’s embedded already.
    const embedCode = `<!-- Kalibri Restoration Lead Widget -->
<div id="kalibri-restoration-widget"></div>

<script
  src="${baseUrl}/widget/kalibri-restoration-widget.js?key=${widgetKey}"
  defer
></script>`;

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Widget</h1>
                <p className="text-sm text-muted-foreground">
                    Install the website widget for{" "}
                    <span className="font-medium text-foreground">{businessName}</span>.
                </p>
            </div>

            <div className="rounded-lg border bg-background p-5 shadow-sm space-y-3">
                <div className="text-base font-semibold">How to install</div>

                <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Copy the embed code below.</li>
                    <li>
                        Paste it into your website (right before{" "}
                        <span className="font-mono text-foreground">{`</body>`}</span>).
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>
                                <span className="font-medium text-foreground">WordPress:</span>{" "}
                                use a Header/Footer plugin (recommended) or edit the theme footer.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Webflow:</span>{" "}
                                Project Settings → Custom Code → Footer Code.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Wix/Squarespace:</span>{" "}
                                Settings → Custom code / Code injection.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Custom site:</span>{" "}
                                paste before closing body tag.
                            </li>
                        </ul>
                    </li>
                    <li>Save/publish your site, refresh the homepage, and test the widget.</li>
                </ol>

                <div className="text-xs text-muted-foreground">
                    After install: go to <span className="font-medium text-foreground">Leads</span> and{" "}
                    <span className="font-medium text-foreground">Analytics</span> to confirm activity.
                </div>
            </div>

            <EmbedCodeBlock
                title="Embed code"
                description="Copy/paste this into your website (before </body>)."
                code={embedCode}
                
            />
        </div>
    );
}

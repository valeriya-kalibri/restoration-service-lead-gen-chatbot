"use client";

import * as React from "react";

type Platform = "wordpress" | "webflow" | "wix" | "squarespace" | "custom";

const PLATFORMS: { key: Platform; label: string }[] = [
    { key: "wordpress", label: "WordPress" },
    { key: "webflow", label: "Webflow" },
    { key: "wix", label: "Wix" },
    { key: "squarespace", label: "Squarespace" },
    { key: "custom", label: "Custom / HTML" },
];

const STEPS: Record<Platform, string[]> = {
    wordpress: [
        "In your WordPress admin, go to Plugins → Add New.",
        'Search for "WPCode – Insert Headers and Footers" and install it, then click Activate.',
        "Go to Code Snippets → + Add Snippet → Add Your Custom Code.",
        'Paste your embed code, set the location to "Footer", then click Save & Activate.',
        "Visit your website — you should see the chat bubble in the bottom corner.",
    ],
    webflow: [
        "Open your Webflow project and click the gear icon (⚙) to open Project Settings.",
        'Click the "Custom Code" tab.',
        'Paste your embed code into the "Footer Code" box.',
        'Click "Save Changes", then publish your site.',
        "Open your live site — the chat bubble will appear in the bottom corner.",
    ],
    wix: [
        "From your Wix dashboard, go to Settings → Custom Code (under the Advanced section).",
        'Click "+ Add Custom Code" in the top right.',
        "Paste your embed code into the code box.",
        'Set "Place Code in" to "Body — End", choose "All Pages", then click Apply.',
        "Publish your site and open it — you'll see the chat bubble in the corner.",
    ],
    squarespace: [
        "In your Squarespace dashboard, go to Settings → Advanced → Code Injection.",
        'Paste your embed code into the "Footer" field.',
        "Click Save.",
        "Open your live site — the chat bubble will appear in the bottom corner.",
    ],
    custom: [
        "Open your website's HTML file in a text editor (or your site builder's HTML editor).",
        'Find the line that says </body> near the very bottom of the file.',
        "Paste your embed code on the line directly above </body>.",
        "Save the file and upload it to your server (or publish through your builder).",
        "Open your site in a browser — the chat bubble will appear in the bottom corner.",
    ],
};

export function PlatformSteps() {
    const [active, setActive] = React.useState<Platform>("wordpress");
    const steps = STEPS[active];

    return (
        <div className="space-y-4">
            {/* Platform picker */}
            <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActive(key)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                            active === key
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Steps for selected platform */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary mt-0.5">
                            {i + 1}
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const SECTIONS = [
    {
        title: "Total Sessions",
        body: "Every time someone opens your chatbot widget counts as one session — whether they answered one question or all of them. This is your raw visitor engagement number.",
    },
    {
        title: "Conversions",
        body: "A conversion happens when a visitor submits their contact information (name, phone, email). This is the core goal of the widget — turning anonymous visitors into identifiable leads.",
    },
    {
        title: "Conversion Rate",
        body: "Conversions divided by total sessions, shown as a percentage. Industry average for live chat is 15–30%. If yours is low, check the drop-off section below to see where visitors are leaving.",
    },
    {
        title: "Outcome Breakdown",
        body: "Shows how each session ended. Call Initiated means the visitor tapped your phone number. Callback Requested means they submitted info and asked you to call them. SMS Initiated means they chose to text. Lead Captured covers all sessions where contact info was collected. Unknown means the session ended without a recorded action — usually an early exit.",
    },
    {
        title: "Where You're Losing Leads",
        body: "Each bar shows the last question a visitor answered before they left without converting. The longer the bar, the more people dropped off at that step. Use this to identify friction points — if most people leave at 'Damage Description', that question may be too detailed or intimidating.",
    },
];

export function AnalyticsExplainer() {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl border bg-indigo-50 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-indigo-100/60 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-primary">
                        How to read this page
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Guide
                    </span>
                </div>
                {open
                    ? <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                }
            </button>

            {open && (
                <div className="border-t px-5 py-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-white">
                    {SECTIONS.map(({ title, body }) => (
                        <div key={title} className="space-y-1">
                            <div className="text-xs font-bold text-foreground">{title}</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
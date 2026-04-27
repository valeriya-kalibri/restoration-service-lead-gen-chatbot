"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function SystemExplainer() {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl border bg-indigo-50 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-indigo-100/60 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-primary">
                        How the system works
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
                <div className="border-t bg-white px-5 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your AI chatbot greets every visitor the moment they land on your website — no forms, no waiting. It walks them through a short conversation to find out what type of damage they have, how urgent it is, and captures their name, phone, email, and location. High-urgency leads trigger an instant SMS alert to your team. Every conversation is logged here so nothing slips through the cracks, whether it arrives at 2pm or 2am. On each lead you can set a follow-up status — New, Called, Voicemail, Scheduled, or Closed — and leave a private note so you always know exactly where things stand when you check back in.
                    </p>
                </div>
            )}
        </div>
    );
}
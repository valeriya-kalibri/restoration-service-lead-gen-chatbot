"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

type Props = {
    code: string;
    note?: string;
};

export function EmbedCodeBlock({ code, note }: Props) {
    const [copied, setCopied] = React.useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable — user can still select + copy
        }
    }

    return (
        <div className="space-y-3">
            <div className="rounded-xl border bg-white overflow-hidden">
                <pre className="whitespace-pre-wrap break-words p-4 text-xs leading-5 text-foreground font-mono">
                    <code>{code}</code>
                </pre>
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={onCopy} className="gap-2">
                    {copied
                        ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                        : <><Copy className="h-3.5 w-3.5" /> Copy code</>
                    }
                </Button>
                {note && <span className="text-xs text-muted-foreground">{note}</span>}
            </div>
        </div>
    );
}
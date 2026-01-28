"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Props = {
    title: string;
    description?: string;
    code: string;
    note?: string;
};

export function EmbedCodeBlock({ title, description, code, note }: Props) {
    const [copied, setCopied] = React.useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // If clipboard fails, do nothing (user can still select + copy)
        }
    }

    return (
        <div className="rounded-lg border bg-background p-5 shadow-sm space-y-3">
            <div className="space-y-1">
                <div className="text-base font-semibold text-primary">{title}</div>
                {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-foreground">
                    <code>{code}</code>
                </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onCopy}>{copied ? "Copied" : "Copy code"}</Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        // highlight/select code area
                        const sel = window.getSelection?.();
                        sel?.removeAllRanges?.();
                    }}
                >
                    (Optional) Manual copy
                </Button>
            </div>

            {note ? <div className="text-xs text-muted-foreground">{note}</div> : null}
        </div>
    );
}

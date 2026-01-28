"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const OUTCOMES = [
    "call_initiated",
    "callback_requested",
    "lead_captured",
    "abandoned",
    "unknown",
] as const;

type ChatOutcome = (typeof OUTCOMES)[number];

const LABEL: Record<ChatOutcome, string> = {
    call_initiated: "Call initiated",
    callback_requested: "Callback requested",
    lead_captured: "Lead captured",
    abandoned: "Abandoned",
    unknown: "Unknown",
};

export function OutcomeButtons({
    sessionId,
    currentOutcome,
}: {
    sessionId: string;
    currentOutcome?: string | null;
}) {
    const router = useRouter();
    const [saving, setSaving] = React.useState<ChatOutcome | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    async function setOutcome(outcome: ChatOutcome) {
        setSaving(outcome);
        setError(null);

        try {
            const res = await fetch("/api/chat/set-outcome", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, outcome }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(json?.error ?? "Failed to set outcome");
                return;
            }

            // 🔑 Force server component to re-fetch updated outcome
            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to set outcome");
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="rounded-md border p-3">
            <div className="text-sm font-semibold mb-2">Mark outcome</div>

            <div className="flex flex-wrap gap-2">
                {OUTCOMES.map((o) => (
                    <Button
                        key={o}
                        variant={currentOutcome === o ? "default" : "outline"}
                        disabled={saving !== null}
                        onClick={() => setOutcome(o)}
                    >
                        {saving === o ? "Saving..." : LABEL[o]}
                    </Button>
                ))}
            </div>

            {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
        </div>
    );
}

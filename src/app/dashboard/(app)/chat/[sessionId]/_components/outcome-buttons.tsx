"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    ACTION_OUTCOMES,
    ACTION_OUTCOME_LABEL,
    type ActionOutcome,
} from "@/lib/chat/outcomes";

export function OutcomeButtons({
    sessionId,
    currentActionOutcome,
}: {
    sessionId: string;
    currentActionOutcome?: string | null;
}) {
    const router = useRouter();
    const [saving, setSaving] = React.useState<ActionOutcome | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    async function setActionOutcome(actionOutcome: ActionOutcome) {
        setSaving(actionOutcome);
        setError(null);

        try {
            const res = await fetch("/api/chat/set-outcome", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    action_outcome: actionOutcome,
                }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(json?.error ?? "Failed to set action outcome");
                return;
            }

            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to set action outcome");
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-semibold">Mark action outcome</div>

            <div className="flex flex-wrap gap-2">
                {ACTION_OUTCOMES.map((o) => (
                    <Button
                        key={o}
                        variant={currentActionOutcome === o ? "default" : "outline"}
                        disabled={saving !== null}
                        onClick={() => setActionOutcome(o)}
                    >
                        {saving === o ? "Saving..." : ACTION_OUTCOME_LABEL[o]}
                    </Button>
                ))}
            </div>

            {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
        </div>
    );
}
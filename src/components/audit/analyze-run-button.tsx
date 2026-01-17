"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AnalyzeRunButton({ runId }: { runId: string }) {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onAnalyze() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/audit/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ runId }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json?.error ?? "Failed to start analysis.");
            }

            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to start analysis.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <Button onClick={onAnalyze} disabled={loading}>
                {loading ? "Starting…" : "Analyze"}
            </Button>
            {error ? <div className="text-xs text-destructive">{error}</div> : null}
        </div>
    );
}

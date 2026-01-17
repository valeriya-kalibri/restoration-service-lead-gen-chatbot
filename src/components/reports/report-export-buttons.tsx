"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ReportExportButtons({
    runId,
    disabled,
}: {
    runId: string;
    disabled: boolean;
}) {
    const [loadingDownload, setLoadingDownload] = React.useState(false);
    const [loadingEmail, setLoadingEmail] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);

    async function handleDownload() {
        setMessage(null);
        setLoadingDownload(true);
        try {
            window.location.href = `/api/reports/pdf?runId=${encodeURIComponent(runId)}`;
        } catch {
            setMessage("Failed to download PDF.");
        } finally {
            setLoadingDownload(false);
        }
    }

    async function handleEmail() {
        setMessage(null);
        setLoadingEmail(true);
        try {
            const res = await fetch("/api/reports/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ runId }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json?.error ?? "Failed to send email.");
            }

            setMessage("Email sent. Check your inbox (and spam).");
        } catch (err: any) {
            setMessage(err?.message ?? "Failed to send email.");
        } finally {
            setLoadingEmail(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownload} disabled={disabled || loadingDownload}>
                    {loadingDownload ? "Preparing…" : "Download PDF"}
                </Button>

                <Button
                    variant="outline"
                    onClick={handleEmail}
                    disabled={disabled || loadingEmail}
                >
                    {loadingEmail ? "Sending…" : "Email PDF Report"}
                </Button>
            </div>

            {message ? (
                <div className="text-xs text-muted-foreground">{message}</div>
            ) : null}
        </div>
    );
}

"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
    auditRunId: string;
    status: string;
};

export function AuditRunPanel({ auditRunId, status }: Props) {
    const [loadingAnalyze, setLoadingAnalyze] = React.useState(false);
    const [loadingReport, setLoadingReport] = React.useState(false);
    const [msg, setMsg] = React.useState<string | null>(null);

    async function runAudit() {
        setMsg(null);
        setLoadingAnalyze(true);
        try {
            const res = await fetch("/api/audit/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auditRunId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Failed");
            setMsg("Audit started. Refresh in a few seconds to see results.");
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoadingAnalyze(false);
        }
    }

    async function sendReport() {
        setMsg(null);
        setLoadingReport(true);
        try {
            const res = await fetch("/api/audit/actions/send-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auditRunId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Failed");
            setMsg("Report emailed.");
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setLoadingReport(false);
        }
    }

    const canSendReport = status === "analyzed";

    return (
        <div className="space-y-3 rounded-lg border bg-background p-4">
            <div className="text-sm font-medium">Audit Controls</div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={runAudit} disabled={loadingAnalyze}>
                    {loadingAnalyze ? "Running..." : "Run Audit"}
                </Button>

                <Button variant="outline" onClick={sendReport} disabled={!canSendReport || loadingReport}>
                    {loadingReport ? "Sending..." : "Email PDF Report"}
                </Button>
            </div>

            {msg ? <div className="text-xs text-muted-foreground">{msg}</div> : null}
            <div className="text-xs text-muted-foreground">
                Status: <span className="font-medium">{status}</span>
            </div>
        </div>
    );
}

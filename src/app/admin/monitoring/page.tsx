import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

const CONVERSION_OUTCOMES = new Set(["call_initiated", "callback_requested", "lead_captured"]);

type ClientRow = {
    id: string;
    business_name: string | null;
    account_status: string | null;
    widget_enabled: boolean | null;
    widget_key: string | null;
    business_phone: string | null;
};

export default async function AdminMonitoringPage() {
    const supabase = await createClient();

    // 1) Load all clients (profiles)
    const { data: clients, error: clientsErr } = await supabase
        .from("profiles")
        .select("id,business_name,account_status,widget_enabled,widget_key,business_phone")
        .order("created_at", { ascending: false });

    if (clientsErr) {
        return (
            <div className="mx-auto max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Monitoring</h1>
                <p className="text-sm text-destructive">Failed to load clients: {clientsErr.message}</p>
            </div>
        );
    }

    const rows: ClientRow[] = (clients ?? []) as any;
    const clientIds = rows.map((c) => c.id);

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

    // 2) Sessions last 30 days (for drop-offs + leaking)
    const { data: sessions, error: sessErr } = await supabase
        .from("chat_sessions")
        .select("client_id,last_step_id,outcome,lead_phone,created_at")
        .gte("created_at", since30)
        .in("client_id", clientIds);

    // 3) SMS events last 30 days (health)
    const { data: smsEvents, error: smsErr } = await supabase
        .from("chat_events")
        .select("client_id,event_type,created_at")
        .gte("created_at", since30)
        .in("client_id", clientIds)
        .in("event_type", [
            "sms_sent_business",
            "sms_failed_business",
            "sms_skipped_business",
            "sms_sent_lead",
            "sms_failed_lead",
            "sms_skipped_lead",
            "sms_sent_business_details",
            "sms_failed_business_details",
            "sms_skipped_business_details",
        ]);

    // ---------- Aggregate ----------
    const byClient = new Map<
        string,
        {
            sessions: number;
            conversions: number;
            leads: number;
            leaking: number;
            dropoffs: Record<string, number>;
            sms: {
                sent: number;
                failed: number;
                skipped: number;
            };
        }
    >();

    for (const c of rows) {
        byClient.set(c.id, {
            sessions: 0,
            conversions: 0,
            leads: 0,
            leaking: 0,
            dropoffs: {},
            sms: { sent: 0, failed: 0, skipped: 0 },
        });
    }

    for (const s of sessions ?? []) {
        const m = byClient.get(s.client_id as string);
        if (!m) continue;

        m.sessions++;

        const hasLead = !!s.lead_phone;
        const isConv = CONVERSION_OUTCOMES.has(String(s.outcome ?? ""));

        if (hasLead) m.leads++;
        if (isConv) m.conversions++;

        // "Leaking" = session exists but not converted (no callback/call/text) and no lead_phone captured
        if (!isConv && !hasLead) m.leaking++;

        const step = (s.last_step_id as string | null) ?? "unknown";
        m.dropoffs[step] = (m.dropoffs[step] ?? 0) + 1;
    }

    for (const e of smsEvents ?? []) {
        const m = byClient.get(e.client_id as string);
        if (!m) continue;

        const t = String(e.event_type ?? "");
        if (t.includes("sent")) m.sms.sent++;
        else if (t.includes("failed")) m.sms.failed++;
        else if (t.includes("skipped")) m.sms.skipped++;
    }

    // ---------- Global rollups ----------
    const globalDropoffs: Record<string, number> = {};
    let totalSessions = 0;
    let totalLeaking = 0;
    let totalSmsSent = 0;
    let totalSmsFailed = 0;
    let totalSmsSkipped = 0;

    for (const [_, m] of byClient) {
        totalSessions += m.sessions;
        totalLeaking += m.leaking;
        totalSmsSent += m.sms.sent;
        totalSmsFailed += m.sms.failed;
        totalSmsSkipped += m.sms.skipped;

        for (const [step, count] of Object.entries(m.dropoffs)) {
            globalDropoffs[step] = (globalDropoffs[step] ?? 0) + count;
        }
    }

    const topDropoffs = Object.entries(globalDropoffs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const leakingClients = rows
        .map((c) => {
            const m = byClient.get(c.id)!;
            return { c, m };
        })
        .filter(({ m }) => m.sessions >= 10 && m.leaking / Math.max(1, m.sessions) >= 0.6)
        .sort((a, b) => (b.m.leaking / b.m.sessions) - (a.m.leaking / a.m.sessions))
        .slice(0, 10);

    const brokenConfigClients = rows.filter((c) => {
        const widgetEnabled = c.widget_enabled !== false;
        if (!widgetEnabled) return true;
        if (!c.widget_key) return true;
        // business_phone is needed for Call/Text + lead confirmation quality
        if (!c.business_phone) return true;
        return false;
    });

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Monitoring</h1>
                    <p className="text-sm text-muted-foreground">
                        Global health (last 30 days): drop-offs, leaking leads, SMS status, and client config issues.
                    </p>
                    {sessErr ? <p className="text-xs text-destructive">Sessions load error: {sessErr.message}</p> : null}
                    {smsErr ? <p className="text-xs text-destructive">SMS events load error: {smsErr.message}</p> : null}
                </div>

                <Button asChild variant="outline">
                    <Link href="/admin">Back</Link>
                </Button>
            </div>

            {/* Top cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-background p-4">
                    <div className="text-sm font-medium">Total sessions</div>
                    <div className="mt-1 text-2xl font-semibold">{totalSessions}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Last 30 days</div>
                </div>

                <div className="rounded-lg border bg-background p-4">
                    <div className="text-sm font-medium">Leaking sessions</div>
                    <div className="mt-1 text-2xl font-semibold">{totalLeaking}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Sessions without conversion and without lead phone
                    </div>
                </div>

                <div className="rounded-lg border bg-background p-4">
                    <div className="text-sm font-medium">SMS health</div>
                    <div className="mt-2 text-sm">
                        Sent: <span className="font-semibold">{totalSmsSent}</span>
                    </div>
                    <div className="text-sm">
                        Failed: <span className="font-semibold">{totalSmsFailed}</span>
                    </div>
                    <div className="text-sm">
                        Skipped: <span className="font-semibold">{totalSmsSkipped}</span>
                    </div>
                </div>
            </div>

            {/* Drop-offs */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-semibold text-primary">Top drop-off steps</div>
                <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Step</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {topDropoffs.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-3 text-muted-foreground" colSpan={2}>
                                        No data yet.
                                    </td>
                                </tr>
                            ) : (
                                topDropoffs.map(([step, count]) => (
                                    <tr key={step} className="[&>td]:px-3 [&>td]:py-2">
                                        <td className="font-mono">{step}</td>
                                        <td>{count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Leaking clients */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-semibold text-primary">Leaking clients (likely losing leads)</div>
                <div className="mt-1 text-xs text-muted-foreground">
                    Heuristic: ≥10 sessions and ≥60% leaking rate (last 30 days)
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Client</th>
                                <th>Sessions</th>
                                <th>Leaking</th>
                                <th>Leak rate</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {leakingClients.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                                        No obvious leaking clients yet.
                                    </td>
                                </tr>
                            ) : (
                                leakingClients.map(({ c, m }) => {
                                    const rate = m.sessions ? Math.round((m.leaking / m.sessions) * 100) : 0;
                                    return (
                                        <tr key={c.id} className="[&>td]:px-3 [&>td]:py-2">
                                            <td>{c.business_name ?? "—"}</td>
                                            <td>{m.sessions}</td>
                                            <td>{m.leaking}</td>
                                            <td>{rate}%</td>
                                            <td className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/clients/${c.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Broken config */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-semibold text-primary">Clients with config issues</div>
                <div className="mt-1 text-xs text-muted-foreground">
                    Widget disabled, missing widget_key, or missing business_phone
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Client</th>
                                <th>Status</th>
                                <th>Widget</th>
                                <th>widget_key</th>
                                <th>Business phone</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {brokenConfigClients.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                                        No config issues found.
                                    </td>
                                </tr>
                            ) : (
                                brokenConfigClients.map((c) => {
                                    const widgetOk = c.widget_enabled !== false;
                                    const keyOk = !!c.widget_key;
                                    const phoneOk = !!c.business_phone;

                                    return (
                                        <tr key={c.id} className="[&>td]:px-3 [&>td]:py-2">
                                            <td>{c.business_name ?? "—"}</td>
                                            <td>{c.account_status ?? "—"}</td>
                                            <td>{widgetOk ? "enabled" : "disabled"}</td>
                                            <td>{keyOk ? "ok" : "missing"}</td>
                                            <td>{phoneOk ? "ok" : "missing"}</td>
                                            <td className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/clients/${c.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";


const CONVERSION_OUTCOMES = new Set(["call_initiated", "callback_requested"]);

function isUuid(x: unknown) {
    return typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

export default async function AdminClientsPage() {
    const supabase = await createClient();

    // ✅ Must be logged in
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) redirect("/");

    // ✅ Must be admin (profiles.role)
    const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

    if (meErr || me?.role !== "admin") redirect("/dashboard");

    const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id,business_name,account_status,widget_enabled,widget_key,created_at")
        .order("created_at", { ascending: false });

    if (profilesErr) {
        return (
            <div className="mx-auto max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Clients</h1>
                <p className="text-sm text-destructive">Failed to load profiles: {profilesErr.message}</p>
                <Button asChild variant="outline">
                    <Link href="/admin">Back</Link>
                </Button>
            </div>
        );
    }

    const rows = (profiles ?? []).filter((p: any) => isUuid(p?.id));
    const clientIds = rows.map((p: any) => p.id);

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("client_id,created_at,outcome,lead_phone")
        .gte("created_at", since30)
        .in("client_id", clientIds);

    const metrics = new Map<string, any>();
    for (const p of rows) {
        metrics.set(p.id, { s7: 0, l7: 0, c7: 0, s30: 0, l30: 0, c30: 0 });
    }

    for (const s of sessions ?? []) {
        const cid = (s as any).client_id;
        const m = metrics.get(cid);
        if (!m) continue;

        const hasLead = !!(s as any).lead_phone;
        const isConv = CONVERSION_OUTCOMES.has((s as any).outcome);

        m.s30++;
        if (hasLead) m.l30++;
        if (isConv) m.c30++;

        if ((s as any).created_at >= since7) {
            m.s7++;
            if (hasLead) m.l7++;
            if (isConv) m.c7++;
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Clients</h1>
                    <p className="text-sm text-muted-foreground">
                        Snapshot metrics for 7/30 days. View a client for exports.
                    </p>
                </div>

                <Button asChild variant="outline">
                    <Link href="/admin">Back</Link>
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Business</th>
                                <th>7d Sessions</th>
                                <th>7d Leads</th>
                                <th>7d Conv</th>
                                <th>30d Sessions</th>
                                <th>30d Leads</th>
                                <th>30d Conv</th>
                                <th>Status</th>
                                <th>Widget</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-muted-foreground" colSpan={10}>
                                        No valid clients found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((p: any) => {
                                    const m = metrics.get(p.id) ?? { s7: 0, l7: 0, c7: 0, s30: 0, l30: 0, c30: 0 };
                                    const widgetOk = p.widget_enabled !== false;
                                    const hasKey = !!p.widget_key;

                                    return (
                                        <tr key={p.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                            <td className="whitespace-nowrap">{p.business_name ?? "—"}</td>
                                            <td>{m.s7}</td>
                                            <td>{m.l7}</td>
                                            <td>{m.c7}</td>
                                            <td>{m.s30}</td>
                                            <td>{m.l30}</td>
                                            <td>{m.c30}</td>
                                            <td className="whitespace-nowrap">{p.account_status ?? "—"}</td>
                                            <td className="whitespace-nowrap">
                                                {widgetOk ? (
                                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                        On
                                                    </span>
                                                ) : (
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">Off</span>
                                                )}
                                                {!hasKey ? (
                                                    <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">No key</span>
                                                ) : null}
                                            </td>
                                            <td className="text-right whitespace-nowrap">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/clients/${p.id}`}>View</Link>
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

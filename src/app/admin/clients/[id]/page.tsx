import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

const CONVERSION_OUTCOMES = new Set(["call_initiated", "callback_requested"]);

export default async function AdminClientPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const supabase = await createClient();
    const { id } = await params;


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

    // ✅ Load client profile (the client we are viewing)
    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id,business_name,widget_key,widget_enabled,account_status,business_phone")
        .eq("id", id)
        .maybeSingle();

    if (profileErr) {
        return (
            <div className="mx-auto max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Client</h1>
                <p className="text-sm text-destructive">Failed to load client: {profileErr.message}</p>
                <Button asChild variant="outline">
                    <Link href="/admin/clients">Back</Link>
                </Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Client not found</h1>
                <p className="text-sm text-muted-foreground">
                    No profile exists for this id (or it was deleted).
                </p>
                <Button asChild variant="outline">
                    <Link href="/admin/clients">Back</Link>
                </Button>
            </div>
        );
    }

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: sessions, error: sessionsErr } = await supabase
        .from("chat_sessions")
        .select("created_at,outcome,lead_phone,inquiry_type")
        .eq("client_id", id)
        .gte("created_at", since30)
        .order("created_at", { ascending: false });

    if (sessionsErr) {
        return (
            <div className="mx-auto max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">{profile.business_name ?? "Client"}</h1>
                <p className="text-sm text-destructive">Failed to load sessions: {sessionsErr.message}</p>
                <Button asChild variant="outline">
                    <Link href="/admin/clients">Back</Link>
                </Button>
            </div>
        );
    }

    let s7 = 0,
        l7 = 0,
        c7 = 0,
        s30 = 0,
        l30 = 0,
        c30 = 0;

    for (const s of sessions ?? []) {
        const lead = !!s.lead_phone;
        const conv = CONVERSION_OUTCOMES.has(s.outcome);

        s30++;
        if (lead) l30++;
        if (conv) c30++;

        if (s.created_at >= since7) {
            s7++;
            if (lead) l7++;
            if (conv) c7++;
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">{profile.business_name ?? "—"}</h1>
                    <p className="text-sm text-muted-foreground">Client analytics + exports.</p>
                </div>

                <Button asChild variant="outline">
                    <Link href="/admin/clients">Back</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-background p-4 space-y-2">
                    <h2 className="font-medium">Last 7 days</h2>
                    <p>Sessions: {s7}</p>
                    <p>Leads: {l7}</p>
                    <p>Conversions: {c7}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                            <a href={`/admin/clients/${id}/export.csv?days=7`}>CSV</a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                            <a href={`/admin/clients/${id}/export.pdf?days=7`}>PDF</a>
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border bg-background p-4 space-y-2">
                    <h2 className="font-medium">Last 30 days</h2>
                    <p>Sessions: {s30}</p>
                    <p>Leads: {l30}</p>
                    <p>Conversions: {c30}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                            <a href={`/admin/clients/${id}/export.csv?days=30`}>CSV</a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                            <a href={`/admin/clients/${id}/export.pdf?days=30`}>PDF</a>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-background p-4 text-sm space-y-1">
                <p>
                    <span className="text-muted-foreground">Widget key:</span> {profile.widget_key ?? "—"}
                </p>
                <p>
                    <span className="text-muted-foreground">Widget enabled:</span>{" "}
                    {profile.widget_enabled ? "yes" : "no"}
                </p>
                <p>
                    <span className="text-muted-foreground">Account status:</span> {profile.account_status ?? "—"}
                </p>
                <p>
                    <span className="text-muted-foreground">Business phone:</span> {profile.business_phone ?? "—"}
                </p>
            </div>
        </div>
    );
}

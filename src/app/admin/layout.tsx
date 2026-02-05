import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    // Must be logged in
    if (!data.user) {
        redirect("/");
    }

    // Must be admin (server-side gate)
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (error || !profile || profile.role !== "admin") {
        redirect("/dashboard");
    }


    return (
        <div className="min-h-screen bg-muted/30">
            <AppHeader title="KALIBRI ADMIN PORTAL" />

            {/* Reuse your universal shell/nav for admin too */}
            <DashboardShell sidebar={<DashboardNav isAdmin />}>{children}</DashboardShell>

        </div>
    );
}

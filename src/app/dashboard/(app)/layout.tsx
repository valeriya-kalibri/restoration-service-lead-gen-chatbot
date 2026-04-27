﻿import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { AppFooter } from "@/components/layout/app-footer";

export default async function DashboardAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    // Not logged in â†’ welcome
    if (!data.user) {
        redirect("/");
    }

    // Load profile gates
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, account_status")
        .eq("id", data.user.id)
        .single();

    // Missing profile / query error â†’ force onboarding (or you can redirect to /)
    if (!profile || error) {
        redirect("/dashboard/onboarding");
    }

    // Soft-cancel gate - keep session alive so user can reactivate
    if (profile.account_status === "cancelled") {
        redirect("/dashboard/reactivate");
    }

    // Enforce onboarding for ALL dashboard routes under (app)
    if (profile.onboarding_completed !== true) {
        redirect("/dashboard/onboarding");
    }

    // Admin flag (for showing Admin link)
    // Admin flag (for showing Admin link) - use profiles.role
    const { data: roleRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    const isAdmin = roleRow?.role === "admin";


    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            <AppHeader />
            <DashboardShell sidebar={<DashboardNav isAdmin={isAdmin} />}>
                {children}
            </DashboardShell>
            <AppFooter />
        </div>
    );
}

import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function DashboardAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    // Not logged in → welcome
    if (!data.user) {
        redirect("/");
    }

    // Load profile gates
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, account_status")
        .eq("id", data.user.id)
        .single();

    // Missing profile / query error → force onboarding (or you can redirect to /)
    if (!profile || error) {
        redirect("/dashboard/onboarding");
    }

    // ✅ Soft-cancel gate (block dashboard access)
    if (profile.account_status === "cancelled") {
        // Optional: sign out as well to avoid confusing “logged in but blocked” state
        await supabase.auth.signOut();
        redirect("/?cancelled=1");
    }

    // Enforce onboarding for ALL dashboard routes under (app)
    if (profile.onboarding_completed !== true) {
        redirect("/dashboard/onboarding");
    }

    // Admin flag (for showing Admin link)
    const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

    const isAdmin = !!adminRole;

    return (
        <div className="min-h-screen bg-muted/30">
            <AppHeader title="KALIBRI BUSINESS OPERATIONS AUDIT" />
            <DashboardShell sidebar={<DashboardNav isAdmin={isAdmin} />}>
                {children}
            </DashboardShell>
        </div>
    );
}

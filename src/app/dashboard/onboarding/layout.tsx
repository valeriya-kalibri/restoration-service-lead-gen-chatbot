import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    // Onboarding is only for logged-in users
    if (!data.user) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <AppHeader title="RESTORATION SERVICE LEAD GENERATION CHATBOT" />

            <DashboardShell sidebar={<DashboardNav />}>
                {children}
            </DashboardShell>
        </div>
    );
}

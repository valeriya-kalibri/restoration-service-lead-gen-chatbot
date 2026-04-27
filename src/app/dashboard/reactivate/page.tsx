import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default async function ReactivatePage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile } = await supabase
        .from("profiles")
        .select("account_status, cancelled_at, cancel_reason")
        .eq("id", auth.user.id)
        .single();

    if (!profile || profile.account_status !== "cancelled") {
        redirect("/dashboard");
    }

    async function reactivateAccount() {
        "use server";
        const supabase = await createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) redirect("/");

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "active",
                cancelled_at: null,
                cancel_reason: null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            <AppHeader />
            <main className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <RotateCcw className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Reactivate Account</h1>
                            <p className="text-xs text-muted-foreground">Your account is currently cancelled</p>
                        </div>
                    </div>

                    {(profile.cancelled_at || profile.cancel_reason) && (
                        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1 text-muted-foreground">
                            {profile.cancelled_at && (
                                <div>
                                    Cancelled:{" "}
                                    <span className="font-medium text-foreground">
                                        {new Date(profile.cancelled_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {profile.cancel_reason && (
                                <div>
                                    Reason:{" "}
                                    <span className="font-medium text-foreground">{profile.cancel_reason}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Reactivating restores full dashboard access, lead tracking, and SMS alerts.
                    </p>

                    <form action={reactivateAccount}>
                        <Button type="submit" className="w-full">
                            Reactivate my account
                        </Button>
                    </form>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
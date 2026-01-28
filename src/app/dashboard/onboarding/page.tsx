import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./ui/onboarding-form";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, business_name, phone, business_description, onboarding_completed")
        .eq("id", auth.user.id)
        .maybeSingle();

    // If already completed, send them to dashboard
    if (profile?.onboarding_completed) redirect("/dashboard");

    const email = auth.user.email ?? profile?.email ?? "";

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold text-primary">Onboarding</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tell us a little about your business. 
                </p>
            </div>

            <OnboardingForm
                email={email}
                initial={{
                    full_name: profile?.full_name ?? "",
                    business_name: profile?.business_name ?? "",
                    phone: profile?.phone ?? "",
                    business_description: profile?.business_description ?? "",
                }}
            />
        </div>
    );
}

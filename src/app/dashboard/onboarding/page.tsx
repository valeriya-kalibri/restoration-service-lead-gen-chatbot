import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./ui/onboarding-form";
import { ClipboardList } from "lucide-react";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, business_name, business_phone, business_description, onboarding_completed")
        .eq("id", auth.user.id)
        .maybeSingle();

    if (profile?.onboarding_completed) redirect("/dashboard");

    const email = auth.user.email ?? profile?.email ?? "";

    return (
        <div className="space-y-5">
            {/* Banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Welcome
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Let&apos;s get you set up</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Tell us about your business so we can personalise your lead capture chatbot.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <ClipboardList className="h-6 w-6 text-white" />
                </div>
            </div>

            <OnboardingForm
                email={email}
                initial={{
                    full_name: profile?.full_name ?? "",
                    business_name: profile?.business_name ?? "",
                    phone: profile?.business_phone ?? "",
                    business_description: profile?.business_description ?? "",
                }}
            />
        </div>
    );
}
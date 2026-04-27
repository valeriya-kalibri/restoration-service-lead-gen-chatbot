import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { CancelAccountSection } from "./_components/cancel-account-section";

function normalizeUSPhoneToE164(input: string) {
    const raw = (input ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("+")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return null;
}

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold mt-0.5">
                {step}
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-xs font-semibold text-primary uppercase tracking-wider">
            {children}
        </label>
    );
}

const inputClass = "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("email,full_name,business_name,business_phone,business_description,account_status,cancelled_at,cancel_reason")
        .eq("id", auth.user.id)
        .single();

    if (error || !profile) {
        return (
            <div className="space-y-2">
                <h1 className="text-xl font-semibold text-primary">Settings</h1>
                <p className="text-sm text-destructive">
                    Failed to load profile: {error?.message ?? "Unknown error"}
                </p>
            </div>
        );
    }

    async function saveProfile(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) redirect("/");

        const full_name = String(formData.get("full_name") ?? "").trim();
        const business_name = String(formData.get("business_name") ?? "").trim();
        const phoneRaw = String(formData.get("business_phone") ?? "").trim();
        const business_description = String(formData.get("business_description") ?? "").trim();
        const e164 = normalizeUSPhoneToE164(phoneRaw);

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: full_name.length ? full_name : null,
                business_name: business_name.length ? business_name : null,
                business_phone: e164,
                business_description: business_description.length ? business_description : null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);
        redirect("/dashboard/settings?saved=1");
    }

    async function cancelAccount(formData: FormData) {
        "use server";
        const supabase = await createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) redirect("/");

        const reason = String(formData.get("cancel_reason") ?? "").trim();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancel_reason: reason.length ? reason : null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);
        await supabase.auth.signOut();
        redirect("/?cancelled=1");
    }

    const cancelled = profile.account_status === "cancelled";

    return (
        <div className="space-y-5">
            {/* Banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Settings
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Keep your profile accurate — your business details personalise your chatbot and SMS alerts.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Settings className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Section 1 — Profile */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={1}
                    title="Profile"
                    subtitle="Update your name, business info, and contact number for SMS alerts."
                />

                {/* Email — read only */}
                <div className="mb-4 space-y-1.5">
                    <FieldLabel>Email</FieldLabel>
                    <div className="rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground">
                        {profile.email ?? "—"}
                    </div>
                </div>

                <form action={saveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                        <FieldLabel>Full name</FieldLabel>
                        <input
                            name="full_name"
                            defaultValue={profile.full_name ?? ""}
                            placeholder="e.g., Jane Smith"
                            className={inputClass}
                            disabled={cancelled}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Business name</FieldLabel>
                        <input
                            name="business_name"
                            defaultValue={profile.business_name ?? ""}
                            placeholder="e.g., Smith Restoration LLC"
                            className={inputClass}
                            disabled={cancelled}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Phone</FieldLabel>
                        <input
                            name="business_phone"
                            defaultValue={profile.business_phone ?? ""}
                            placeholder="e.g., (321) 555-0100"
                            className={inputClass}
                            disabled={cancelled}
                        />
                        <p className="text-xs text-muted-foreground">
                            Auto-formatted as <span className="font-mono">+1XXXXXXXXXX</span> for SMS delivery.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Business description</FieldLabel>
                        <textarea
                            name="business_description"
                            defaultValue={profile.business_description ?? ""}
                            placeholder="What services do you provide and where?"
                            className="min-h-[120px] w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                            disabled={cancelled}
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={cancelled}>
                            Save changes
                        </Button>
                        <Button asChild type="button" variant="outline" className="bg-white">
                            <Link href="/dashboard">Back</Link>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Section 2 — Account */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={2}
                    title="Account"
                    subtitle="Cancelling disables dashboard access but keeps your chat history."
                />

                <CancelAccountSection
                    cancelAccount={cancelAccount}
                    cancelled={cancelled}
                    cancelledAt={profile.cancelled_at ?? null}
                    cancelReason={profile.cancel_reason ?? null}
                />
            </div>
        </div>
    );
}
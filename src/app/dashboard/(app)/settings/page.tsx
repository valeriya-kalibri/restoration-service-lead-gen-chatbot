import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { CancelAccountSection } from "./_components/cancel-account-section";
import { BrandColorInput } from "./_components/brand-color-input";
import { BusinessHoursInput } from "./_components/business-hours-input";

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

const SERVICES = [
    { id: "water_damage", label: "Water Damage Restoration" },
    { id: "fire_smoke", label: "Fire & Smoke Restoration" },
    { id: "mold_remediation", label: "Mold Remediation" },
    { id: "hvac", label: "HVAC Services" },
    { id: "roofing", label: "Roofing & Structural Repair" },
    { id: "plumbing", label: "Plumbing" },
    { id: "electrical", label: "Electrical" },
    { id: "disaster_response", label: "Disaster Response & Cleanup" },
];

const INSTALL_OPTIONS = [
    {
        id: "self",
        label: "I'll add it myself",
        description: "See the instructions on the Widget Install page",
    },
    {
        id: "developer",
        label: "I have a developer who can add it",
        description: "We'll send them the embed code",
    },
    {
        id: "kalibri",
        label: "I'd like Kalibri to handle it",
        description: "We'll request access to your site",
    },
];

const PLATFORMS = [
    "WordPress",
    "Squarespace",
    "Wix",
    "Webflow",
    "Shopify",
    "Custom HTML",
    "Other",
];

const inputClass =
    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select(
            "email,full_name,business_name,business_phone,business_description,account_status,cancelled_at,cancel_reason,services_offered,service_area,sms_alert_number,business_hours,website_url,website_platform,widget_install_preference,primary_color"
        )
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
        const e164 = normalizeUSPhoneToE164(String(formData.get("business_phone") ?? ""));
        const business_description = String(formData.get("business_description") ?? "").trim();

        const services_offered = formData.getAll("services_offered") as string[];
        const service_area = String(formData.get("service_area") ?? "").trim();
        const sms_alert_number = normalizeUSPhoneToE164(String(formData.get("sms_alert_number") ?? ""));

        const hours_raw = String(formData.get("business_hours") ?? "").trim();
        let business_hours: Record<string, unknown> | null = null;
        try {
            if (hours_raw) business_hours = JSON.parse(hours_raw);
        } catch { /* invalid JSON — leave null */ }

        const website_url = String(formData.get("website_url") ?? "").trim();
        const website_platform = String(formData.get("website_platform") ?? "").trim();
        const widget_install_preference = String(formData.get("widget_install_preference") ?? "").trim();
        const primary_color = String(formData.get("primary_color") ?? "").trim();

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: full_name || null,
                business_name: business_name || null,
                business_phone: e164,
                business_description: business_description || null,
                services_offered,
                service_area: service_area || null,
                sms_alert_number,
                business_hours,
                website_url: website_url || null,
                website_platform: website_platform || null,
                widget_install_preference: widget_install_preference || null,
                primary_color: primary_color || null,
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
                cancel_reason: reason || null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);
        await supabase.auth.signOut();
        redirect("/?cancelled=1");
    }

    const cancelled = profile.account_status === "cancelled";
    const servicesOffered: string[] = profile.services_offered ?? [];

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

            <form action={saveProfile} className="space-y-5">
                {/* Section 1 — Profile */}
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <SectionHeader
                        step={1}
                        title="Profile"
                        subtitle="Your name, business info, and main contact number."
                    />

                    <div className="mb-4 space-y-1.5">
                        <FieldLabel>Email</FieldLabel>
                        <div className="rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground">
                            {profile.email ?? "—"}
                        </div>
                    </div>

                    <div className="space-y-4">
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
                            <FieldLabel>Business phone</FieldLabel>
                            <input
                                name="business_phone"
                                defaultValue={profile.business_phone ?? ""}
                                placeholder="(321) 555-0100"
                                className={inputClass}
                                disabled={cancelled}
                            />
                            <p className="text-xs text-muted-foreground">
                                Shown to leads in the widget. Auto-formatted as{" "}
                                <span className="font-mono">+1XXXXXXXXXX</span>.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Business description</FieldLabel>
                            <textarea
                                name="business_description"
                                defaultValue={profile.business_description ?? ""}
                                placeholder="What services do you provide and where?"
                                className="min-h-[100px] w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                disabled={cancelled}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2 — Services & Coverage */}
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <SectionHeader
                        step={2}
                        title="Services & Coverage"
                        subtitle="What you offer and where — used to tailor the chatbot conversation."
                    />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <FieldLabel>Services offered</FieldLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {SERVICES.map((s) => (
                                    <label
                                        key={s.id}
                                        className="flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 cursor-pointer hover:bg-indigo-50/60 text-sm select-none"
                                    >
                                        <input
                                            type="checkbox"
                                            name="services_offered"
                                            value={s.id}
                                            defaultChecked={servicesOffered.includes(s.id)}
                                            disabled={cancelled}
                                            className="rounded"
                                        />
                                        {s.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>City / Service area</FieldLabel>
                            <input
                                name="service_area"
                                defaultValue={profile.service_area ?? ""}
                                placeholder="e.g., Orlando, FL and surrounding counties"
                                className={inputClass}
                                disabled={cancelled}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3 — Availability & Alerts */}
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <SectionHeader
                        step={3}
                        title="Availability & Alerts"
                        subtitle="When you're open and who gets urgent lead texts."
                    />

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Business hours</FieldLabel>
                            <BusinessHoursInput
                                defaultValue={
                                    profile.business_hours
                                        ? JSON.stringify(profile.business_hours)
                                        : null
                                }
                                disabled={cancelled}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>SMS alert number</FieldLabel>
                            <input
                                name="sms_alert_number"
                                defaultValue={profile.sms_alert_number ?? ""}
                                placeholder="(321) 555-0200"
                                className={inputClass}
                                disabled={cancelled}
                            />
                            <p className="text-xs text-muted-foreground">
                                Who receives urgent lead texts. Leave blank to use your business phone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 4 — Website */}
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <SectionHeader
                        step={4}
                        title="Website"
                        subtitle="Where and how the widget will be installed."
                    />

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Website URL</FieldLabel>
                            <input
                                name="website_url"
                                type="url"
                                defaultValue={profile.website_url ?? ""}
                                placeholder="https://smithrestoration.com"
                                className={inputClass}
                                disabled={cancelled}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Platform</FieldLabel>
                            <select
                                name="website_platform"
                                defaultValue={profile.website_platform ?? ""}
                                className={inputClass}
                                disabled={cancelled}
                            >
                                <option value="">Select platform…</option>
                                {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <FieldLabel>Widget installation</FieldLabel>
                            <div className="space-y-2">
                                {INSTALL_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.id}
                                        className="flex items-start gap-3 rounded-lg border bg-white px-4 py-3 cursor-pointer has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 hover:bg-indigo-50/60 transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="widget_install_preference"
                                            value={opt.id}
                                            defaultChecked={profile.widget_install_preference === opt.id}
                                            disabled={cancelled}
                                            className="mt-0.5 shrink-0 accent-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 5 — Brand */}
                <div className="rounded-xl border bg-indigo-50 p-5">
                    <SectionHeader
                        step={5}
                        title="Brand"
                        subtitle="Widget header and button color."
                    />
                    <div className="space-y-1.5">
                        <FieldLabel>Brand color</FieldLabel>
                        <BrandColorInput
                            defaultValue={profile.primary_color ?? "#2563eb"}
                            disabled={cancelled}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" disabled={cancelled}>
                        Save changes
                    </Button>
                    <Button asChild type="button" variant="outline" className="bg-white">
                        <Link href="/dashboard">Back</Link>
                    </Button>
                </div>
            </form>

            {/* Section 6 — Account */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader
                    step={6}
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
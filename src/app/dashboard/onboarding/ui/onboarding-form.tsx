"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SectionHeader({ step, title }: { step: number; title: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                {step}
            </div>
            <h2 className="text-sm font-bold tracking-widest text-foreground uppercase">{title}</h2>
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
] as const;

const PLATFORMS = [
    "WordPress",
    "Squarespace",
    "Wix",
    "Webflow",
    "Shopify",
    "Custom HTML",
    "Other",
];

function isValidHex(val: string) {
    return /^#[0-9A-Fa-f]{6}$/.test(val);
}

export function OnboardingForm({
    email,
    initial,
}: {
    email: string;
    initial: {
        full_name: string;
        business_name: string;
        phone: string;
        business_description: string;
        services_offered: string[];
        service_area: string;
        website_url: string;
        website_platform: string;
        widget_install_preference: string;
        primary_color: string;
    };
}) {
    const [fullName, setFullName] = React.useState(initial.full_name);
    const [businessName, setBusinessName] = React.useState(initial.business_name);
    const [phone, setPhone] = React.useState(initial.phone);
    const [description, setDescription] = React.useState(initial.business_description);
    const [services, setServices] = React.useState<string[]>(initial.services_offered);
    const [serviceArea, setServiceArea] = React.useState(initial.service_area);
    const [websiteUrl, setWebsiteUrl] = React.useState(initial.website_url);
    const [websitePlatform, setWebsitePlatform] = React.useState(initial.website_platform);
    const [installPref, setInstallPref] = React.useState(initial.widget_install_preference);
    const [brandColor, setBrandColor] = React.useState(initial.primary_color || "#2563eb");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const colorValid = isValidHex(brandColor);

    function toggleService(id: string) {
        setServices((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await fetch("/api/profile/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: fullName,
                business_name: businessName,
                phone,
                business_description: description,
                services_offered: services,
                service_area: serviceArea,
                website_url: websiteUrl,
                website_platform: websitePlatform,
                widget_install_preference: installPref || null,
                primary_color: colorValid ? brandColor : null,
            }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            setError(json?.error ?? "Failed to save onboarding.");
            setLoading(false);
            return;
        }

        window.location.href = "/dashboard";
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {/* Section 1 — Profile */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader step={1} title="Your profile" />

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <FieldLabel>Email</FieldLabel>
                        <div className="rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground">
                            {email}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Full name</FieldLabel>
                        <Input
                            className="bg-white"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jane Smith"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Business name</FieldLabel>
                        <Input
                            className="bg-white"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Smith Restoration LLC"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Phone number</FieldLabel>
                        <Input
                            className="bg-white"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(321) 555-0100"
                            type="tel"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2 — Services & Coverage */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader step={2} title="Services & coverage" />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <FieldLabel>Services offered</FieldLabel>
                        <p className="text-xs text-muted-foreground -mt-1">
                            Select everything that applies — used to tailor your chatbot.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SERVICES.map((s) => (
                                <label
                                    key={s.id}
                                    className="flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 cursor-pointer hover:bg-indigo-50/60 text-sm select-none"
                                >
                                    <input
                                        type="checkbox"
                                        checked={services.includes(s.id)}
                                        onChange={() => toggleService(s.id)}
                                        className="rounded"
                                    />
                                    {s.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>City / Service area</FieldLabel>
                        <Input
                            className="bg-white"
                            value={serviceArea}
                            onChange={(e) => setServiceArea(e.target.value)}
                            placeholder="e.g., Orlando, FL and surrounding counties"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3 — Website & Brand */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader step={3} title="Website & brand" />

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <FieldLabel>Website URL</FieldLabel>
                        <Input
                            className="bg-white"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://smithrestoration.com"
                            type="url"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Platform</FieldLabel>
                        <select
                            className="h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={websitePlatform}
                            onChange={(e) => setWebsitePlatform(e.target.value)}
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
                                    className={`flex items-start gap-3 rounded-lg border bg-white px-4 py-3 cursor-pointer transition-colors ${
                                        installPref === opt.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-indigo-50/60"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="widget_install_preference"
                                        value={opt.id}
                                        checked={installPref === opt.id}
                                        onChange={() => setInstallPref(opt.id)}
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

                    <div className="space-y-1.5">
                        <FieldLabel>Brand color</FieldLabel>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-9 w-9 shrink-0 rounded-lg border transition-colors"
                                style={{ background: colorValid ? brandColor : "#e5e7eb" }}
                            />
                            <Input
                                className="bg-white font-mono"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                placeholder="#2563eb"
                                maxLength={7}
                            />
                            <input
                                type="color"
                                value={colorValid ? brandColor : "#2563eb"}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border p-0.5 bg-white"
                                title="Open color picker"
                            />
                        </div>
                        {brandColor && !colorValid && (
                            <p className="text-xs text-destructive">
                                Enter a valid hex color, e.g.{" "}
                                <span className="font-mono">#2563eb</span>
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Appears in the widget header and buttons. You can change this anytime in Settings.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 4 — Current lead process */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader step={4} title="Your current lead process" />

                <div className="space-y-1.5">
                    <FieldLabel>How do new leads reach you today?</FieldLabel>
                    <textarea
                        className="w-full min-h-[100px] rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., phone calls, Google Ads, Google Maps, referrals, Angi, contact forms…"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-8">
                    {loading ? "Saving…" : "Continue to dashboard →"}
                </Button>
            </div>
        </form>
    );
}
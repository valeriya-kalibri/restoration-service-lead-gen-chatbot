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
    };
}) {
    const [fullName, setFullName] = React.useState(initial.full_name);
    const [businessName, setBusinessName] = React.useState(initial.business_name);
    const [phone, setPhone] = React.useState(initial.phone);
    const [description, setDescription] = React.useState(initial.business_description);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

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
                    {/* Email — read only */}
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

            {/* Section 2 — Lead process */}
            <div className="rounded-xl border bg-indigo-50 p-5">
                <SectionHeader step={2} title="Your current lead process" />

                <div className="space-y-1.5">
                    <FieldLabel>How do new leads reach you today?</FieldLabel>
                    <textarea
                        className="w-full min-h-[120px] rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
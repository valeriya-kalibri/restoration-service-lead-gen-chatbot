"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <form onSubmit={onSubmit} className="rounded-lg border bg-background p-4 space-y-4">
            <div className="space-y-1">
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground">{email}</div>
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium text-primary">Full name</div>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)}  />
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium text-primary">Business name</div>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)}  />
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium text-primary">Phone number</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)}  />
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium text-primary">Current Lead Generation Process</div>
                <textarea
                    className="w-full min-h-[120px] rounded-md border bg-transparent px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="How do new leads reach you today? (calls, Google Ads, Google Maps, forms, Angi, referrals, etc. ?"
                />
                
            </div>

            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : "Continue"}
                </Button>
            </div>
        </form>
    );
}
  
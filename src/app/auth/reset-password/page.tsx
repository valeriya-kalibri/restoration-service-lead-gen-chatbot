"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = React.useMemo(() => createClient(), []);

    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [ready, setReady] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;

        async function initRecoverySession() {
            try {
                const hash = typeof window !== "undefined" ? window.location.hash : "";
                const hasRecoveryTokens =
                    hash.includes("access_token=") || hash.includes("type=recovery");

                if (hasRecoveryTokens) {
                    const { error } = await supabase.auth.getSession();
                    if (error && mounted) {
                        setError("This reset link is invalid or expired. Please request a new one.");
                        setReady(true);
                        return;
                    }
                }

                const { data, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error || !data.session) {
                    setError("This reset link is invalid or expired. Please request a new one.");
                    setReady(true);
                    return;
                }

                setReady(true);
            } catch {
                if (!mounted) return;
                setError("This reset link is invalid or expired. Please request a new one.");
                setReady(true);
            }
        }

        initRecoverySession();
        return () => { mounted = false; };
    }, [supabase]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password });
            if (error) { setError(error.message); return; }
            setSuccess(true);
            setTimeout(() => { router.replace("/dashboard"); }, 1200);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl overflow-hidden border shadow-lg">
                {/* Branded header — matches auth sheet */}
                <div className="bg-primary pl-4 pr-6 pt-5 pb-4">
                    <div className="flex items-center gap-1.5">
                        <Image
                            src="/images/kalibri-logo512.png"
                            alt=""
                            width={32}
                            height={32}
                            style={{ filter: "invert(1)" }}
                        />
                        <span className="text-xs font-semibold tracking-widest text-primary-foreground">
                            KALIBRI STUDIOS
                        </span>
                    </div>
                    <h1 className="mt-2 text-xl font-bold tracking-wide text-primary-foreground">
                        RESET PASSWORD
                    </h1>
                </div>

                {/* Form body — matches auth sheet */}
                <div className="bg-white pt-5 px-6 pb-6 space-y-4">
                    {!ready ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : success ? (
                        <p className="text-sm text-muted-foreground">
                            Password updated successfully. Redirecting…
                        </p>
                    ) : (
                        <form onSubmit={onSubmit} className="space-y-4">
                            {error ? (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    {error}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-xs font-medium">New password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium">Confirm password</label>
                                <Input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Saving…" : "Update password"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
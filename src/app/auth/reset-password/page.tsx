"use client";

import * as React from "react";
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

                // If tokens are in the URL fragment, let Supabase read them and establish session.
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

        return () => {
            mounted = false;
        };
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

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);

            // Small pause so user sees success, then send to login.
            setTimeout(() => {
                router.replace("/");
            }, 1200);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-md space-y-4 px-4 py-10">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Reset password</h1>
                <p className="text-sm text-muted-foreground">
                    Set a new password for your account.
                </p>
            </div>

            {!ready ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
            ) : success ? (
                <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                    Password updated successfully. Redirecting…
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-background p-4">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-primary">New password</div>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm font-medium text-primary">Confirm password</div>
                        <Input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    {error ? <div className="text-sm text-destructive">{error}</div> : null}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving…" : "Update password"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
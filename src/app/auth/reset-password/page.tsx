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
    const [error, setError] = React.useState<string | null>(null);
    const [ready, setReady] = React.useState(false);

    // Supabase sets a recovery session when arriving from the reset link.
    React.useEffect(() => {
        let mounted = true;

        (async () => {
            const { data, error } = await supabase.auth.getSession();
            if (!mounted) return;

            // If no session, user didn't come from the email link (or it expired).
            if (error || !data.session) {
                setError("This reset link is invalid or expired. Please request a new one.");
                setReady(true);
                return;
            }

            setReady(true);
        })();

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

        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Go through your existing smart redirect
        router.replace("/auth/callback");
    }

    return (
        <div className="mx-auto max-w-md px-4 py-10 space-y-4">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Reset password</h1>
                <p className="text-sm text-muted-foreground">
                    Set a new password for your account.
                </p>
            </div>

            {!ready ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
                <form onSubmit={onSubmit} className="rounded-lg border bg-background p-4 space-y-3">
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

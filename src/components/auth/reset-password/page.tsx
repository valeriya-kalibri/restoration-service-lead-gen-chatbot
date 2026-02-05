"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        const { error: err } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (err) {
            setError(err.message);
            return;
        }

        setSuccess(true);

        router.push("/auth/callback");
        router.refresh();
    }

    return (
        <div className="mx-auto max-w-md px-4 py-10 space-y-4">
            <h1 className="text-xl font-semibold">Set a new password</h1>

            {success ? (
                <p className="text-sm text-muted-foreground">
                    Password updated. Redirecting…
                </p>
            ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                    <Input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                    />

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Updating..." : "Update password"}
                    </Button>
                </form>
            )}
        </div>
    );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

type LoginFormProps = {
    onSwitchToRegister?: () => void;
    onForgotPassword?: () => void;
    onSuccess?: () => void;
};

function getBaseUrl() {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
    if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
    return "http://localhost:3000";
}

export default function LoginForm({
    onSwitchToRegister,
    onForgotPassword,
    onSuccess,
}: LoginFormProps) {
    const supabase = React.useMemo(() => createClient(), []);
    const router = useRouter();

    const [loading, setLoading] = React.useState(false);
    const [resetLoading, setResetLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [message, setMessage] = React.useState<string | null>(null);

    const [emailValue, setEmailValue] = React.useState("");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email"));
        const password = String(formData.get("password"));

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setLoading(false);
        onSuccess?.();
        router.push("/dashboard");
        router.refresh();
    }

    async function handleForgotPassword() {
        setError(null);
        setMessage(null);

        const email = emailValue.trim();

        if (!email) {
            setError("Enter your email first, then click Forgot password.");
            return;
        }

        setResetLoading(true);

        try {
            const redirectTo = `${getBaseUrl()}/auth/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (error) {
                setError(error.message);
                return;
            }

            setMessage("Password reset email sent. Check your inbox.");
            onForgotPassword?.();
        } finally {
            setResetLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 px-4">
            <div className="space-y-1 text-center">
                <div className="text-sm font-semibold">Log in</div>
                <div className="text-xs text-muted-foreground">Welcome back</div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            ) : null}

            {message ? (
                <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                    {message}
                </div>
            ) : null}

            <div className="space-y-2">
                <label className="text-xs font-medium">Email</label>
                <Input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium">Password</label>
                <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                />
            </div>

            <div className="flex justify-center pt-2">
                <Button type="submit" disabled={loading || resetLoading} className="px-8">
                    {loading ? "Logging in..." : "Log in"}
                </Button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
                <button
                    type="button"
                    className="text-muted-foreground underline-offset-4 hover:underline"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                >
                    {resetLoading ? "Sending..." : "Forgot password?"}
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">No account?</span>
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Register
                    </button>
                </div>
            </div>
        </form>
    );
}
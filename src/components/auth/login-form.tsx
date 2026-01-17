"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

type LoginFormProps = {
    onSwitchToRegister?: () => void;
    onSuccess?: () => void;
};

export default function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
    const supabase = React.useMemo(() => createClient(), []);
    const router = useRouter();

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
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

        // success
        setLoading(false);
        onSuccess?.();
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 px-4">
            {/* Title */}
            <div className="space-y-1 text-center">
                <div className="text-sm font-semibold">Log in</div>
                <div className="text-xs text-muted-foreground">Welcome back</div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            ) : null}

            {/* Email */}
            <div className="space-y-2">
                <label className="text-xs font-medium">Email</label>
                <Input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                />
            </div>

            {/* Password */}
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

            {/* Button */}
            <div className="flex justify-center pt-2">
                <Button type="submit" disabled={loading} className="px-8">
                    {loading ? "Logging in..." : "Log in"}
                </Button>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
                <button
                    type="button"
                    className="text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => setError("Forgot password isn’t wired yet.")}
                >
                    Forgot password?
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

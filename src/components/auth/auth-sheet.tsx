"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

type AuthView = "login" | "register" | "forgot";

type AuthSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultView?: Exclude<AuthView, "forgot">;
};

function ForgotPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
    const supabase = React.useMemo(() => createClient(), []);
    const [email, setEmail] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [msg, setMsg] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setError(null);

        const trimmed = email.trim();
        if (!trimmed) {
            setError("Enter your email.");
            return;
        }

        setLoading(true);

        // Keep your existing route to avoid breaking what you configured in Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        setMsg("Password reset email sent. Check your inbox.");
    }

    return (
        <div className="space-y-4 px-4">
            <div className="space-y-1 text-center">
                <div className="text-sm font-semibold">Reset password</div>
                <div className="text-xs text-muted-foreground">
                    Enter your email and we’ll send you a reset link.
                </div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            ) : null}

            {msg ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {msg}
                </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium">Email</label>
                    <Input
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-center pt-2">
                    <Button type="submit" disabled={loading} className="px-8">
                        {loading ? "Sending..." : "Send reset link"}
                    </Button>
                </div>
            </form>

            <div className="pt-1 text-center">
                <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={onBackToLogin}
                >
                    Back to log in
                </button>
            </div>
        </div>
    );
}

export function AuthSheet({ open, onOpenChange, defaultView = "login" }: AuthSheetProps) {
    const [view, setView] = React.useState<AuthView>(defaultView);
    const router = useRouter();

    React.useEffect(() => {
        if (open) setView(defaultView);
    }, [open, defaultView]);

    const title =
        view === "login" ? "Log in" : view === "register" ? "Create account" : "Reset password";

    function handleSuccess() {
        onOpenChange(false);
        router.push("/auth/callback");
        router.refresh();
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader className="space-y-1">
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>

                <div className="pt-4">
                    {view === "login" ? (
                        <LoginForm
                            onSwitchToRegister={() => setView("register")}
                            onForgotPassword={() => setView("forgot")}
                            onSuccess={handleSuccess}
                        />
                    ) : view === "register" ? (
                        <RegisterForm
                            onSwitchToLogin={() => setView("login")}
                            onSuccess={handleSuccess}
                        />
                    ) : (
                        <ForgotPasswordForm onBackToLogin={() => setView("login")} />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

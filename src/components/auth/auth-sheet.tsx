"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
        if (!trimmed) { setError("Enter your email."); return; }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setLoading(false);

        if (error) { setError(error.message); return; }
        setMsg("Password reset email sent. Check your inbox.");
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            )}
            {msg && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {msg}
                </div>
            )}

            <div className="space-y-1.5">
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

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send reset link"}
            </Button>

            <div className="text-center">
                <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={onBackToLogin}
                >
                    Back to log in
                </button>
            </div>
        </form>
    );
}

const VIEW_LABELS: Record<AuthView, string> = {
    login: "LOG IN",
    register: "CREATE ACCOUNT",
    forgot: "RESET PASSWORD",
};

export function AuthSheet({ open, onOpenChange, defaultView = "login" }: AuthSheetProps) {
    const [view, setView] = React.useState<AuthView>(defaultView);
    const router = useRouter();

    React.useEffect(() => {
        if (open) setView(defaultView);
    }, [open, defaultView]);

    function handleSuccess() {
        onOpenChange(false);
        router.push("/dashboard");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {/* Branded header */}
                <div className="bg-primary pl-4 pr-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
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
                        <DialogClose className="rounded-sm text-primary-foreground/70 opacity-80 hover:opacity-100 focus:outline-none">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>
                    <DialogTitle className="mt-2 text-xl font-bold tracking-wide text-primary-foreground">
                        {VIEW_LABELS[view]}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {view === "login"
                            ? "Log in to your Kalibri Studios account."
                            : view === "register"
                            ? "Create a new Kalibri Studios account."
                            : "Reset your Kalibri Studios account password."}
                    </DialogDescription>
                </div>

                {/* Form body */}
                <div className="bg-white pt-5">
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
            </DialogContent>
        </Dialog>
    );
}
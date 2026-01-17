"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

type AuthView = "login" | "register";

type AuthSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultView?: AuthView;
};

export function AuthSheet({ open, onOpenChange, defaultView = "login" }: AuthSheetProps) {
    const [view, setView] = React.useState<AuthView>(defaultView);
    const router = useRouter();

    React.useEffect(() => {
        if (open) setView(defaultView);
    }, [open, defaultView]);

    const title = view === "login" ? "Log in" : "Create account";

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
                            onSuccess={handleSuccess}
                        />
                    ) : (
                        <RegisterForm
                            onSwitchToLogin={() => setView("login")}
                            onSuccess={handleSuccess}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

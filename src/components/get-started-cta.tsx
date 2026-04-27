"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/auth-sheet";

export function HeroCTA({ isAuthed }: { isAuthed: boolean }) {
    const router = useRouter();
    const [sheet, setSheet] = React.useState<"register" | "login" | null>(null);

    if (isAuthed) {
        return (
            <Button
                size="lg"
                onClick={() => { router.push("/dashboard"); router.refresh(); }}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
            >
                Go to Dashboard
            </Button>
        );
    }

    return (
        <>
            <Button
                size="lg"
                onClick={() => setSheet("register")}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
            >
                CREATE ACCOUNT
            </Button>
            <Button
                size="lg"
                onClick={() => setSheet("login")}
                className="bg-transparent border border-white text-white hover:bg-white/10 font-semibold px-8"
            >
                Reactivate Account
            </Button>

            <AuthSheet
                open={sheet !== null}
                onOpenChange={(open) => { if (!open) setSheet(null); }}
                defaultView={sheet ?? "register"}
            />
        </>
    );
}
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/auth-sheet";

export function GetStartedCTA({ isAuthed }: { isAuthed: boolean }) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    function onClick() {
        if (isAuthed) {
            router.push("/dashboard");
            router.refresh();
            return;
        }
        setOpen(true);
    }

    return (
        <>
            <Button onClick={onClick}>Get Started</Button>

            <AuthSheet
                open={open}
                onOpenChange={setOpen}
                defaultView="register"
            />
        </>
    );
}

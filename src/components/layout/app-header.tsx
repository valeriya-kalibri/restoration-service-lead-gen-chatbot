"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/auth-sheet";
import LogoutButton from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/browser";

type AppHeaderProps = {
    title?: string;
};

export function AppHeader({ title = "Business Operations Audit Agent" }: AppHeaderProps) {
    const [open, setOpen] = React.useState(false);
    const [isAuthed, setIsAuthed] = React.useState<boolean>(false);

    React.useEffect(() => {
        const supabase = createClient();

        // initial check
        supabase.auth.getSession().then(({ data }) => {
            setIsAuthed(!!data.session);
        });

        // keep in sync
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthed(!!session);
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, []);

    return (
        <header className="w-full bg-primary text-primary-foreground">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <div className="font-semibold">{title}</div>

                <div className="flex items-center gap-2">
                    {isAuthed ? (
                        <LogoutButton />
                    ) : (
                        <Button variant="secondary" onClick={() => setOpen(true)}>
                            Log in
                        </Button>
                    )}

                    <AuthSheet open={open} onOpenChange={setOpen} />
                </div>
            </div>
        </header>
    );
}

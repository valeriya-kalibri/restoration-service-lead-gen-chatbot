"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth/auth-sheet";
import LogoutButton from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/browser";

export function AppHeader() {
    const [open, setOpen] = React.useState(false);
    const [isAuthed, setIsAuthed] = React.useState<boolean>(false);

    React.useEffect(() => {
        const supabase = createClient();

        supabase.auth.getSession().then(({ data }) => {
            setIsAuthed(!!data.session);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthed(!!session);
        });

        return () => {
            sub.subscription.unsubscribe();
        };
    }, []);

    return (
        <header className="w-full bg-primary border-b border-white/20">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                {/* Logo + brand */}
                <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/kalibri-logo512.png"
                        alt="Kalibri Studios"
                        width={40}
                        height={40}
                        style={{ filter: "invert(1)" }}
                    />
                    <div className="flex flex-col leading-tight">
                        <span className="font-bold text-white tracking-widest text-sm">
                            KALIBRI STUDIOS
                        </span>
                        <span className="text-white/60 tracking-widest text-xs font-medium">
                            RESTORATION SERVICE LEAD GENERATION CHATBOT
                        </span>
                    </div>
                </div>

                {/* Auth controls */}
                <div className="flex items-center gap-2">
                    {isAuthed ? (
                        <LogoutButton className="border border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white" />
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setOpen(true)}
                            className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white font-semibold"
                        >
                            Log in
                        </Button>
                    )}
                    <AuthSheet open={open} onOpenChange={setOpen} />
                </div>
            </div>
        </header>
    );
}
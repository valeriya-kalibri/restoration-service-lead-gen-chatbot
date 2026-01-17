"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
    className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
    const router = useRouter();
    const supabase = React.useMemo(() => createClient(), []);
    const [loading, setLoading] = React.useState(false);

    async function onLogout() {
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
        router.push("/");
        router.refresh();
    }

    return (
        <Button
            type="button"
            variant="secondary"
            onClick={onLogout}
            disabled={loading}
            className={className}
        >
            {loading ? "Logging out..." : "Log out"}
        </Button>
    );
}

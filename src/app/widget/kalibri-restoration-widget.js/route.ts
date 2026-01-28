"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

function isActive(pathname: string, href: string) {
    // Dashboard home
    if (href === "/dashboard") return pathname === "/dashboard";

    // Chat Logs (including session detail)
    if (href === "/dashboard/chat") {
        return pathname === "/dashboard/chat" || pathname.startsWith("/dashboard/chat/");
    }

    // Default behavior for other sections
    return pathname === href || pathname.startsWith(href + "/");
}


type DashboardNavProps = {
    isAdmin?: boolean;
};

export function DashboardNav({ isAdmin = false }: DashboardNavProps) {
    const pathname = usePathname();

    const items = [
        { href: "/dashboard", label: "Dashboard", kind: "outline" as const },
        { href: "/dashboard/chat", label: "Chat Logs", kind: "primary" as const },
        { href: "/dashboard/analytics", label: "Analytics", kind: "outline" as const },
        { href: "/dashboard/leads", label: "Leads", kind: "outline" as const },
        { href: "/dashboard/widget-install", label: "Widget", kind: "outline" as const },
        { href: "/dashboard/settings", label: "Settings", kind: "outline" as const },
    ];


    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => {
                const spacerAfter = item.href === "/dashboard/chat";



                const active = isActive(pathname, item.href);

                let variant: "default" | "outline" =
                    item.kind === "primary" ? "default" : "outline";

                if (active) variant = "default";
                else variant = "outline";

                return (
                    <React.Fragment key={item.href}>
                        <Button asChild variant={variant}>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>

                        {spacerAfter ? <div className="h-2" /> : null}
                    </React.Fragment>
                );
            })}

            {/* ───────────────── Admin section ───────────────── */}
            {isAdmin && (
                <>
                    <div className="h-2" />
                    <Button
                        asChild
                        variant={isActive(pathname, "/admin") ? "default" : "outline"}
                    >
                        <Link href="/admin">Admin</Link>
                    </Button>
                </>
            )}
        </div>
    );
}

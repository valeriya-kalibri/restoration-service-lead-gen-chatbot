import React from "react";

type DashboardShellProps = {
    sidebar: React.ReactNode;
    children: React.ReactNode;
};

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
    return (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[240px_1fr]">
            <aside className="rounded-lg border bg-indigo-50 p-3">{sidebar}</aside>
            <section className="rounded-lg border bg-background p-4">{children}</section>
        </main>
    );
}
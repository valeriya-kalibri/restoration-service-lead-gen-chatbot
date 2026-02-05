import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Admin</h1>
                <p className="text-sm text-muted-foreground">
                    View clients and troubleshoot chatbot activity, leads, and delivery status.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Users */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Users</div>
                        <div className="text-sm text-muted-foreground">
                            Browse profiles and onboarding/status details.
                        </div>
                    </div>

                    <div className="mt-3">
                        <Button asChild>
                            <Link href="/admin/users">Open Users</Link>
                        </Button>
                    </div>
                </div>

                {/* Monitoring */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Monitoring</div>
                        <div className="text-sm text-muted-foreground">
                            Global health dashboard: drop-offs, leaking leads, SMS failures, config issues.
                        </div>
                    </div>

                    <div className="mt-3">
                        <Button asChild>
                            <Link href="/admin/monitoring">Open Monitoring</Link>
                        </Button>
                    </div>
                </div>

                {/* Clients */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">Clients</div>
                        <div className="text-sm text-muted-foreground">
                            View each client and what they see (analytics), plus CSV/PDF exports.
                        </div>
                    </div>

                    <div className="mt-3">
                        <Button asChild>
                            <Link href="/admin/clients">Open Clients</Link>
                        </Button>

                    </div>
                </div>

                {/* Optional placeholder for later features */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-foreground">System notes</div>
                        <div className="text-sm text-muted-foreground">
                            Internal notes area (optional). You can delete this card anytime.
                        </div>
                    </div>

                    <div className="mt-3">
                        <Button asChild>
                            <Link href="/admin/system-notes">Open System Notes</Link>
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    );
}

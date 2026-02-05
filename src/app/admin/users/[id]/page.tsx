import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type Params = { id: string };

type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
    business_description: string | null;
    onboarding_completed: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type RoleRow = {
    user_id: string;
    role: string;
    created_at: string | null;
};

function fmt(dt: string | null) {
    if (!dt) return "—";
    try {
        return new Date(dt).toLocaleString();
    } catch {
        return dt;
    }
}

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    // 1) Load profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
            "id,email,full_name,business_name,phone,business_description,onboarding_completed,created_at,updated_at"
        )
        .eq("id", id)
        .maybeSingle();

    if (profileError) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">User</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Back</Link>
                    </Button>
                </div>
                <p className="text-sm text-destructive">
                    Failed to load user profile: {profileError.message}
                </p>
            </div>
        );
    }

    if (!profile) {
        notFound();
    }

    const p = profile as ProfileRow;

    // 2) Load roles
    // 2) Load role (profiles.role is the source of truth in this template)
    const { data: roleRow, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .single();

    const roleLabel = roleError ? "—" : (roleRow?.role ?? "—");


    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">User Detail</h1>
                    <p className="text-sm text-muted-foreground">
                        Profile and roles for this user.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/users">Back to Users</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin">Admin Home</Link>
                    </Button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Email</div>
                        <div className="text-sm">{p.email ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Role</div>
                        <div className="text-sm">
                            <span
                                className={
                                    roleLabel.includes("admin")
                                        ? "rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary"
                                        : "rounded-md bg-muted px-2 py-0.5 font-medium text-foreground"
                                }
                            >
                                {roleLabel}
                            </span>
                            {roleError ? (
                                <div className="mt-1 text-xs text-destructive">
                                    Roles load failed: {roleError.message}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Full Name</div>
                        <div className="text-sm">{p.full_name ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Business Name</div>
                        <div className="text-sm">{p.business_name ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Phone</div>
                        <div className="text-sm">{p.phone ?? "—"}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Onboarding</div>
                        <div className="text-sm">
                            {p.onboarding_completed ? (
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                                    Complete
                                </span>
                            ) : (
                                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                    Incomplete
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Created</div>
                        <div className="text-sm text-muted-foreground">{fmt(p.created_at)}</div>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Updated</div>
                        <div className="text-sm text-muted-foreground">{fmt(p.updated_at)}</div>
                    </div>

                    <div className="sm:col-span-2">
                        <div className="text-xs font-medium text-muted-foreground">Business Description</div>
                        <div className="text-sm whitespace-pre-wrap">{p.business_description ?? "—"}</div>
                    </div>
                </div>
            </div>

            {/* Chatbot Placeholder */}
            <div className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold">Chatbot Activity</h2>
                        <p className="text-sm text-muted-foreground">
                            Coming next: chat sessions, lead captures, drop-off points, and conversions.
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm" disabled>
                        <span>View Sessions</span>
                    </Button>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                    No chatbot analytics available yet for this user.
                </div>
            </div>
        </div>
    );
}

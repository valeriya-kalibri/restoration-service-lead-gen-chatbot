import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type UserRow = {
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
    onboarding_completed: boolean;
    created_at: string | null;
    updated_at: string | null;
};

export default async function AdminUsersPage() {
    const supabase = await createClient();

    // 1) Pull profiles (base table)
    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name,business_name,onboarding_completed,created_at,updated_at")
        .order("created_at", { ascending: false });

    if (profilesError) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Users</h1>
                <p className="text-sm text-destructive">
                    Failed to load profiles: {profilesError.message}
                </p>
            </div>
        );
    }

    const rows: UserRow[] = (profiles ?? []) as UserRow[];
    const userIds = rows.map((r) => r.id);

    // 2) Pull roles for these users (base table) and join in server code
    // (No views in-app; this is your chosen architecture.)
    const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", userIds);

    // Build role map: user_id -> roles[]
    const roleMap = new Map<string, string[]>();
    if (!rolesError && roles) {
        for (const r of roles) {
            const uid = r.user_id as string;
            const role = r.role as string;
            const existing = roleMap.get(uid) ?? [];
            existing.push(role);
            roleMap.set(uid, existing);
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Users</h1>
                    <p className="text-sm text-muted-foreground">
                        Client profiles + onboarding status. Roles are joined server-side from <code>user_roles</code>.
                    </p>
                    {rolesError ? (
                        <p className="text-xs text-destructive">
                            Roles join failed: {rolesError.message} (profiles still shown)
                        </p>
                    ) : null}
                </div>

                <Button asChild variant="outline">
                    <Link href="/admin">Back</Link>
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Email</th>
                                <th>Name</th>
                                <th>Business</th>
                                <th>Role</th>
                                <th>Onboarding</th>
                                <th>Created</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((u) => {
                                    const rolesForUser = roleMap.get(u.id) ?? [];
                                    // v1 expectation: exactly one role; if not, we show all for visibility.
                                    const roleLabel =
                                        rolesForUser.length === 0 ? "—" : rolesForUser.join(", ");

                                    return (
                                        <tr key={u.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                            <td className="whitespace-nowrap">
                                                {u.email ?? <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {u.full_name ?? <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="max-w-[260px] truncate">
                                                {u.business_name ?? <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <span
                                                    className={
                                                        roleLabel.includes("admin")
                                                            ? "rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary"
                                                            : "rounded-md bg-muted px-2 py-0.5 font-medium text-foreground"
                                                    }
                                                >
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {u.onboarding_completed ? (
                                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                                                        Complete
                                                    </span>
                                                ) : (
                                                    <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                                                        Incomplete
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap text-muted-foreground">
                                                {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                                            </td>
                                            <td className="text-right">
                                                {/* Placeholder for v2 user detail page */}
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/users/${u.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                Next: we’ll create <code>/admin/users/[id]</code> so you can open a user and see their audit runs + results.
            </p>
        </div>
    );
}

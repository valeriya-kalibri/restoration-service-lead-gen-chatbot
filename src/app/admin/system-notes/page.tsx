import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminSystemNotesPage() {
    const supabase = await createClient();

    const { data: notes, error } = await supabase
        .from("admin_notes")
        .select("id,title,body,tags,is_pinned,is_archived,created_at,updated_at")
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">System Notes</h1>
                    <p className="text-sm text-muted-foreground">
                        Internal admin notes for ops, debugging, and client follow-ups.
                    </p>
                    {error ? (
                        <p className="text-xs text-destructive">Load failed: {error.message}</p>
                    ) : null}
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin">Back</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/system-notes/archived">Archived</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/system-notes/new">New Note</Link>
                    </Button>
                </div>

            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Title</th>
                                <th>Tags</th>
                                <th>Updated</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {!notes || notes.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-muted-foreground" colSpan={4}>
                                        No notes yet.
                                    </td>
                                </tr>
                            ) : (
                                notes.map((n) => (
                                    <tr key={n.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                        <td className="min-w-[280px]">
                                            <div className="flex items-center gap-2">
                                                {n.is_pinned ? (
                                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                        Pinned
                                                    </span>
                                                ) : null}
                                                <div className="font-medium">{n.title}</div>
                                            </div>
                                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {n.body}
                                            </div>
                                        </td>
                                        <td className="min-w-[220px]">
                                            {Array.isArray(n.tags) && n.tags.length ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {n.tags.map((t: string) => (
                                                        <span
                                                            key={t}
                                                            className="rounded-md bg-muted px-2 py-0.5 text-xs"
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap text-muted-foreground">
                                            {n.updated_at ? new Date(n.updated_at).toLocaleString() : "—"}
                                        </td>
                                        <td className="text-right">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/system-notes/${n.id}`}>View</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

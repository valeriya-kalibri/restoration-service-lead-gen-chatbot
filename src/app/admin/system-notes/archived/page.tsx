import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/admin/confirm-form";

async function restoreNote(id: string) {
    "use server";
    const supabase = await createClient();
    await supabase.from("admin_notes").update({ is_archived: false }).eq("id", id);
    redirect("/admin/system-notes/archived");
}

async function deleteNote(id: string) {
    "use server";
    const supabase = await createClient();
    await supabase.from("admin_notes").delete().eq("id", id);
    redirect("/admin/system-notes/archived");
}

export default async function ArchivedSystemNotesPage() {
    const supabase = await createClient();

    const { data: notes, error } = await supabase
        .from("admin_notes")
        .select("id,title,body,tags,is_pinned,is_archived,created_at,updated_at")
        .eq("is_archived", true)
        .order("updated_at", { ascending: false });

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">Archived Notes</h1>
                    <p className="text-sm text-muted-foreground">Restore or permanently delete archived notes.</p>
                    {error ? <p className="text-xs text-destructive">Load failed: {error.message}</p> : null}
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/system-notes">Back</Link>
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
                                <th>Title</th>
                                <th>Updated</th>
                                <th className="w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {!notes || notes.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-4 text-muted-foreground" colSpan={3}>
                                        No archived notes.
                                    </td>
                                </tr>
                            ) : (
                                notes.map((n) => (
                                    <tr key={n.id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                                        <td className="min-w-[360px]">
                                            <div className="flex items-center gap-2">
                                                {n.is_pinned ? (
                                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                        Pinned
                                                    </span>
                                                ) : null}
                                                <div className="font-medium">{n.title}</div>
                                            </div>
                                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                                        </td>
                                        <td className="whitespace-nowrap text-muted-foreground">
                                            {n.updated_at ? new Date(n.updated_at).toLocaleString() : "—"}
                                        </td>
                                        <td className="text-right whitespace-nowrap">
                                            <div className="flex gap-2 justify-end">
                                                <form action={restoreNote.bind(null, n.id)}>
                                                    <Button size="sm" variant="outline" type="submit">
                                                        Restore
                                                    </Button>
                                                </form>

                                                <ConfirmForm
                                                    action={deleteNote.bind(null, n.id)}
                                                    message="Delete this archived note permanently? This cannot be undone."
                                                >
                                                    <Button size="sm" variant="outline" type="submit">
                                                        Delete
                                                    </Button>
                                                </ConfirmForm>
                                            </div>
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

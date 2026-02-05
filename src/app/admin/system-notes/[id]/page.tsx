import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/admin/confirm-form";

async function updateNote(id: string, formData: FormData) {
    "use server";

    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();

    const tags = tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];

    if (!title || !body) return;

    await supabase.from("admin_notes").update({ title, body, tags }).eq("id", id);

    redirect(`/admin/system-notes/${id}`);
}

async function togglePinned(id: string) {
    "use server";

    const supabase = await createClient();

    const { data: n } = await supabase
        .from("admin_notes")
        .select("is_pinned")
        .eq("id", id)
        .single();

    const next = !(n?.is_pinned ?? false);

    await supabase.from("admin_notes").update({ is_pinned: next }).eq("id", id);

    redirect(`/admin/system-notes/${id}`);
}

async function archiveNote(id: string) {
    "use server";

    const supabase = await createClient();
    await supabase.from("admin_notes").update({ is_archived: true }).eq("id", id);
    redirect(`/admin/system-notes`);
}

async function deleteNote(id: string) {
    "use server";

    const supabase = await createClient();
    await supabase.from("admin_notes").delete().eq("id", id);
    redirect(`/admin/system-notes`);
}

export default async function SystemNoteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: note, error } = await supabase
        .from("admin_notes")
        .select("id,title,body,tags,is_pinned,is_archived,created_at,updated_at")
        .eq("id", id)
        .single();

    if (error || !note) {
        return (
            <div className="mx-auto w-full max-w-4xl space-y-3">
                <h1 className="text-xl font-semibold text-primary">Note</h1>
                <p className="text-sm text-destructive">
                    Failed to load note: {error?.message ?? "Not found"}
                </p>
                <Button asChild variant="outline">
                    <Link href="/admin/system-notes">Back</Link>
                </Button>
            </div>
        );
    }

    if (note.is_archived) {
        redirect("/admin/system-notes/archived");
    }

    const tagsText = Array.isArray(note.tags) ? note.tags.join(", ") : "";

    return (
        <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">System Note</h1>
                    <p className="text-sm text-muted-foreground">
                        Updated: {note.updated_at ? new Date(note.updated_at).toLocaleString() : "—"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/system-notes">Back</Link>
                    </Button>

                    <form action={togglePinned.bind(null, id)}>
                        <Button type="submit" variant="outline">
                            {note.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                    </form>

                    <form action={archiveNote.bind(null, id)}>
                        <Button type="submit" variant="outline">
                            Archive
                        </Button>
                    </form>

                    <ConfirmForm
                        action={deleteNote.bind(null, id)}
                        message="Delete this note permanently? This cannot be undone."
                    >
                        <Button type="submit" variant="outline">
                            Delete
                        </Button>
                    </ConfirmForm>
                </div>
            </div>

            <div className="rounded-lg border bg-background p-4">
                <form action={updateNote.bind(null, id)} className="space-y-3">
                    <div className="space-y-1">
                        <div className="text-sm font-medium">Title</div>
                        <input
                            name="title"
                            defaultValue={note.title ?? ""}
                            className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm font-medium">Tags</div>
                        <input
                            name="tags"
                            defaultValue={tagsText}
                            className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                            placeholder="Comma-separated (ex: sms, rls, client-x)"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm font-medium">Body</div>
                        <textarea
                            name="body"
                            defaultValue={note.body ?? ""}
                            className="min-h-[260px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <Button type="submit">Save changes</Button>
                </form>
            </div>
        </div>
    );
}

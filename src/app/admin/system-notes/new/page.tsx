import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

async function createNote(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();

    if (!title || !body) return;

    const tags = tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];

    const { data: auth } = await supabase.auth.getUser();
    const created_by = auth?.user?.id ?? null;

    const { data, error } = await supabase
        .from("admin_notes")
        .insert({
            title,
            body,
            tags,
            created_by,
            is_pinned: false,
            is_archived: false,
        })
        .select("id")
        .single();

    if (error || !data?.id) return;

    redirect(`/admin/system-notes/${data.id}`);
}

export default function NewSystemNotePage() {
    return (
        <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-primary">New Note</h1>
                    <p className="text-sm text-muted-foreground">
                        Create an internal admin note.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/system-notes">Back</Link>
                    </Button>
                </div>
            </div>

            <form action={createNote} className="space-y-3">
                <div className="space-y-1">
                    <div className="text-sm font-medium">Title</div>
                    <input
                        name="title"
                        className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                        placeholder="Short, specific title"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <div className="text-sm font-medium">Tags</div>
                    <input
                        name="tags"
                        className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                        placeholder="Comma-separated (ex: sms, rls, client-x)"
                    />
                    <div className="text-xs text-muted-foreground">
                        Optional. Use commas.
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-sm font-medium">Body</div>
                    <textarea
                        name="body"
                        className="min-h-[220px] w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                        placeholder="Write the note..."
                        required
                    />
                </div>

                <Button type="submit">Create Note</Button>
            </form>
        </div>
    );
}

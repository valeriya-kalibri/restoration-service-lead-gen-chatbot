import { createClient } from "@/lib/supabase/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    // Must be logged in
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Must be admin (profiles.role)
    const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

    if (meErr || me?.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }

    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days") ?? 30);
    const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 30;

    const since = new Date(Date.now() - safeDays * 86400000).toISOString();

    const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("client_id", id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

    if (error) {
        return new Response(`Failed to load sessions: ${error.message}`, { status: 500 });
    }

    const headers = Object.keys(data?.[0] ?? {});
    const rows = (data ?? []).map((r: any) =>
        headers.map((h) => `"${String(r?.[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=client-${id}-${safeDays}d.csv`,
        },
    });
}

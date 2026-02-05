import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeText(x: unknown): string | null {
    return typeof x === "string" && x.trim() ? x.trim() : null;
}

export async function POST(req: Request) {
    const supabase = await createClient();

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const widget_key = safeText(body?.widget_key);
    if (!widget_key) {
        return NextResponse.json({ error: "widget_key is required" }, { status: 400 });
    }

    // Source of truth: profiles.widget_key
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, business_name, business_phone, widget_enabled")
        .eq("widget_key", widget_key)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: "Lookup failed", details: error.message }, { status: 500 });
    }

    // IMPORTANT: Do not reveal whether a widget_key exists with too much detail.
    if (!profile) {
        return NextResponse.json({ error: "Invalid widget_key" }, { status: 404 });
    }

    // Return only safe config (no emails, no internal info)
    return NextResponse.json({
        ok: true,
        client_id: profile.id, // needed for ingest
        widget_enabled: profile.widget_enabled !== false,
        business_name: profile.business_name ?? null,
        business_phone: profile.business_phone ?? null,
    });
}

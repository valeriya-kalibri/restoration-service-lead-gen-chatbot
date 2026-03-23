import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, business_name, business_phone, widget_key")
        .eq("widget_key", key)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile?.id) {
        return NextResponse.json({ error: "Invalid key" }, { status: 404 });
    }

    return NextResponse.json({
        ok: true,
        client_id: profile.id,
        business_name: profile.business_name ?? null,
        business_phone: profile.business_phone ?? null,
        widget_enabled: true,
    });
}
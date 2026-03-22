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

    const { data, error } = await supabase
        .from("chatbot_settings")
        .select("client_id, business_phone, business_name, widget_key, widget_enabled")
        .eq("widget_key", key)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: "Invalid key" }, { status: 404 });
    }

    return NextResponse.json({
        ok: true,
        client_id: data.client_id,
        business_phone: data.business_phone ?? null,
        business_name: data.business_name ?? null,
        widget_enabled: data.widget_enabled ?? true,
    });
}
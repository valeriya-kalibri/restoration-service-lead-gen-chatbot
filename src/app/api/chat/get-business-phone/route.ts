import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings, error: settingsErr } = await supabase
        .from("chatbot_settings")
        .select("business_phone")
        .eq("client_id", auth.user.id)
        .maybeSingle();

    if (settingsErr) {
        return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    return NextResponse.json({ business_phone: settings?.business_phone ?? null });
}

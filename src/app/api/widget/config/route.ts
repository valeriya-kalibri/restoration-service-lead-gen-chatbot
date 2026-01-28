import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    
    const supabase = createAdminClient();

    // IMPORTANT:
    // For public widget endpoints, you should use a SERVICE ROLE supabase client
    // (so you are not blocked by RLS).
    // If your createClient() is cookie-based only, this will return nothing on public sites.
    //
    // If you already have RLS policies allowing public reads by widget_key, this will work.
    // If not, I’ll give you the service-role client drop-in in Step 2B below.

    const { data, error } = await supabase
        .from("chatbot_settings")
        .select("client_id, business_phone, business_name, widget_key")
        .eq("widget_key", key)
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Invalid key" }, { status: 404 });

    return NextResponse.json({
        client_id: data.client_id,
        business_phone: data.business_phone ?? null,
        business_name: data.business_name ?? null,
    });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const full_name = String(body?.full_name ?? "").trim();
    const business_name = String(body?.business_name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const business_description = String(body?.business_description ?? "").trim();

    if (!full_name || !business_name) {
        return NextResponse.json({ error: "Full name and business name are required." }, { status: 400 });
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name,
            business_name,
            phone,
            business_description,
            onboarding_completed: true,
        })
        .eq("id", auth.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
}

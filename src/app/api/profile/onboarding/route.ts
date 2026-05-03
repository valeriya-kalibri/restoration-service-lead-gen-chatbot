import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeUSPhoneToE164(input: string) {
    const raw = (input ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("+")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return null;
}

export async function POST(req: Request) {
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const full_name = String(body?.full_name ?? "").trim();
    const business_name = String(body?.business_name ?? "").trim();
    const business_description = String(body?.business_description ?? "").trim();
    const business_phone = normalizeUSPhoneToE164(String(body?.phone ?? ""));

    const services_offered = Array.isArray(body?.services_offered) ? body.services_offered : [];
    const service_area = String(body?.service_area ?? "").trim();
    const website_url = String(body?.website_url ?? "").trim();
    const website_platform = String(body?.website_platform ?? "").trim();
    const widget_install_preference = String(body?.widget_install_preference ?? "").trim();
    const primary_color = String(body?.primary_color ?? "").trim();

    if (!full_name || !business_name) {
        return NextResponse.json({ error: "Full name and business name are required." }, { status: 400 });
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name,
            business_name,
            business_phone,
            business_description: business_description || null,
            services_offered,
            service_area: service_area || null,
            website_url: website_url || null,
            website_platform: website_platform || null,
            widget_install_preference: widget_install_preference || null,
            primary_color: primary_color || null,
            onboarding_completed: true,
        })
        .eq("id", auth.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
}
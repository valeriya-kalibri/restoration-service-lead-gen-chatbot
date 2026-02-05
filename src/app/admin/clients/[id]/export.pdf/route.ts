import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

const CONVERSION_OUTCOMES = new Set(["call_initiated", "callback_requested"]);

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    // ✅ Must be logged in
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // ✅ Must be admin (profiles.role)
    const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

    if (meErr || me?.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const url = new URL(req.url);
    const daysRaw = Number(url.searchParams.get("days") ?? 30);
    const days = Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw <= 365 ? daysRaw : 30;

    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", id)
        .single();

    if (profileErr) {
        return new NextResponse(`Failed to load client profile: ${profileErr.message}`, { status: 500 });
    }

    const { data: sessions, error: sessionsErr } = await supabase
        .from("chat_sessions")
        .select("created_at,outcome,lead_phone,inquiry_type,city,zip")
        .eq("client_id", id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

    if (sessionsErr) {
        return new NextResponse(`Failed to load sessions: ${sessionsErr.message}`, { status: 500 });
    }

    let sessionsCount = 0;
    let leadsCount = 0;
    let conversionsCount = 0;

    for (const s of sessions ?? []) {
        sessionsCount++;
        if (s.lead_phone) leadsCount++;
        if (CONVERSION_OUTCOMES.has(s.outcome)) conversionsCount++;
    }

    // ---- PDF ----
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    let y = page.getHeight() - 50;
    const line = (text: string) => {
        // crude page overflow guard (keeps it from writing off-page)
        if (y < 50) return;
        page.drawText(text, { x: 50, y, size: 12, font });
        y -= 18;
    };

    line(`Client: ${profile?.business_name ?? "Unknown"}`);
    line(`Period: Last ${days} days`);
    y -= 10;

    line(`Total sessions: ${sessionsCount}`);
    line(`Leads captured: ${leadsCount}`);
    line(`Conversions: ${conversionsCount}`);

    y -= 20;
    line("Recent activity:");

    for (const s of (sessions ?? []).slice(0, 10)) {
        const date = new Date(s.created_at).toLocaleString();
        const loc = [s.city, s.zip].filter(Boolean).join(" ");
        line(`• ${date} — ${s.inquiry_type ?? "—"} — ${loc || "—"}`);
    }

    const bytes = await pdf.save(); // Uint8Array

    const ab = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    return new NextResponse(ab, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=client-${id}-${days}d.pdf`,
        },
    });



}

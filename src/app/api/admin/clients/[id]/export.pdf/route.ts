import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

const CONVERSION_OUTCOMES = new Set(["call_initiated", "callback_requested"]);

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

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
        return new Response(`Failed to load profile: ${profileErr.message}`, { status: 500 });
    }

    const { data: sessions, error: sessionsErr } = await supabase
        .from("chat_sessions")
        .select("outcome,lead_phone")
        .eq("client_id", id)
        .gte("created_at", since);

    if (sessionsErr) {
        return new Response(`Failed to load sessions: ${sessionsErr.message}`, { status: 500 });
    }

    let total = 0;
    let leads = 0;
    let conversions = 0;

    for (const s of sessions ?? []) {
        total++;
        if (s.lead_phone) leads++;
        if (CONVERSION_OUTCOMES.has(s.outcome)) conversions++;
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    let y = page.getHeight() - 50;
    const line = (text: string) => {
        if (y < 50) return;
        page.drawText(text, { x: 50, y, size: 12, font });
        y -= 18;
    };

    line("Chatbot Performance Report");
    y -= 10;
    line(`Business: ${profile?.business_name ?? "—"}`);
    line(`Period: Last ${days} days`);
    y -= 10;
    line(`Sessions: ${total}`);
    line(`Leads: ${leads}`);
    line(`Conversions: ${conversions}`);

    const bytes = await pdf.save(); // Uint8Array
    const buffer = Buffer.from(bytes);

    return new Response(buffer, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=client-${id}-${days}d.pdf`,
        },
    });
}


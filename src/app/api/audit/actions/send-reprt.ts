import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type SendReportBody = { auditRunId: string };

export async function POST(req: Request) {
    const supabase = createClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { auditRunId } = (await req.json()) as SendReportBody;
    if (!auditRunId) return NextResponse.json({ error: "Missing auditRunId" }, { status: 400 });

    // Engine switch (hybrid-ready)
    const engine = process.env.REPORT_ENGINE ?? "nextjs";
    if (engine === "n8n") {
        // Later: trigger n8n report workflow here
        return NextResponse.json({ started: false, error: "n8n engine not wired yet" }, { status: 501 });
    }

    try {
        // Fetch analyzed run
        const { data: run, error: fetchErr } = await supabase
            .from("audit_runs")
            .select("id, status, summary, result")
            .eq("id", auditRunId)
            .eq("user_id", auth.user.id)
            .single();

        if (fetchErr || !run) return NextResponse.json({ error: "Audit run not found" }, { status: 404 });
        if (run.status !== "analyzed" || !run.result)
            return NextResponse.json({ error: "Audit not analyzed yet" }, { status: 400 });

        // Generate PDF bytes
        const pdfBytes = await generatePdf({
            title: "Kalibri Operations Audit Report",
            summary: run.summary ?? "",
            result: run.result,
        });

        // Email it (to logged-in user email)
        const to = auth.user.email;
        if (!to) return NextResponse.json({ error: "User email not available" }, { status: 400 });

        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.EMAIL_FROM;
        if (!from) return NextResponse.json({ error: "EMAIL_FROM missing" }, { status: 500 });

        await resend.emails.send({
            from,
            to,
            subject: "Your Kalibri Audit Report (PDF)",
            text: `Here is your audit report.\n\nSummary:\n${run.summary ?? ""}`,
            attachments: [
                {
                    filename: `kalibri-audit-${auditRunId}.pdf`,
                    content: Buffer.from(pdfBytes).toString("base64"),
                },
            ],
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Send report failed" }, { status: 500 });
    }
}

async function generatePdf(params: { title: string; summary: string; result: any }) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // US Letter

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = 742;

    const drawLine = (text: string, bold = false, size = 11) => {
        page.drawText(text, {
            x: margin,
            y,
            size,
            font: bold ? fontBold : font,
            color: rgb(0, 0, 0),
            maxWidth: 512,
        });
        y -= size + 6;
    };

    drawLine(params.title, true, 16);
    y -= 10;

    drawLine("Executive Summary", true, 12);
    wrapText(drawLine, params.summary || "(No summary provided.)");

    y -= 10;
    drawLine("Raw Results (JSON)", true, 12);
    wrapText(drawLine, JSON.stringify(params.result, null, 2));

    return pdf.save();
}

// very simple wrapper (v1). good enough.
function wrapText(drawLine: (t: string) => void, text: string) {
    const lines = text.split("\n");
    for (const line of lines) {
        // keep each line reasonable; split long lines
        if (line.length <= 90) {
            drawLine(line);
            continue;
        }
        let start = 0;
        while (start < line.length) {
            drawLine(line.slice(start, start + 90));
            start += 90;
        }
    }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { pdf } from "@react-pdf/renderer";
import { ReportPdf } from "@/lib/reports/report-pdf";
import type { Readable } from "node:stream";


export const runtime = "nodejs";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !auth.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const runId: string | undefined = body?.runId;
    if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });

    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
    }
    if (!process.env.EMAIL_FROM) {
        return NextResponse.json({ error: "EMAIL_FROM is not set" }, { status: 500 });
    }

    const { data: run, error } = await supabase
        .from("audit_runs")
        .select("id,status,result,created_at")
        .eq("id", runId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    if (run.status !== "analyzed") return NextResponse.json({ error: "Report not ready" }, { status: 409 });

    const createdAt = run.created_at ? new Date(run.created_at).toLocaleString() : null;

    const instance = pdf(
        ReportPdf({
            result: (run.result as any) ?? {},
            createdAt,
        })
    );
    const nodeStream = (await instance.toBuffer()) as unknown as Readable;
    const buffer = await streamToBuffer(nodeStream);


    const resend = new Resend(process.env.RESEND_API_KEY);

    const send = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: auth.user.email,
        subject: "Your Audit Report (PDF)",
        text: "Attached is your audit report PDF.",
        attachments: [
            {
                filename: `audit-report-${run.id}.pdf`,
                content: buffer.toString("base64"),
            },
        ],
    });

    // Resend returns { data, error }
    if ((send as any)?.error) {
        const msg = (send as any).error?.message ?? "Resend failed";
        console.error("Resend error:", (send as any).error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log("Resend sent:", (send as any)?.data);
    return NextResponse.json({ ok: true, data: (send as any)?.data }, { status: 200 });

}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
        stream.on("data", (chunk) =>
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}


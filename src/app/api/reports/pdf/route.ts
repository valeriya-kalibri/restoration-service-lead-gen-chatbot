import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdf } from "@react-pdf/renderer";
import { ReportPdf } from "@/lib/reports/report-pdf";
import type { Readable } from "node:stream";


export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const runId = url.searchParams.get("runId");

    const base = supabase
        .from("audit_runs")
        .select("id,status,result,created_at")
        .eq("user_id", auth.user.id);

    const { data: run, error } = runId
        ? await base.eq("id", runId).maybeSingle()
        : await base.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!run) return NextResponse.json({ error: "No audit run found" }, { status: 404 });
    if (run.status !== "analyzed") return NextResponse.json({ error: "Report not ready" }, { status: 409 });

    const createdAt = run.created_at ? new Date(run.created_at).toLocaleString() : null;

    // ✅ Correct server-side PDF generation
    const instance = pdf(
        ReportPdf({
            result: (run.result as any) ?? {},
            createdAt,
        })
    );

    const nodeStream = (await instance.toBuffer()) as unknown as Readable;
    const buffer = await streamToBuffer(nodeStream);

    return new NextResponse(buffer, {

        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="audit-report-${run.id}.pdf"`,
            "Cache-Control": "no-store",
        },
    });
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

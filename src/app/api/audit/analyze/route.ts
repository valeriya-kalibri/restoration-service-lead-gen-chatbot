import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.AUDIT_MODEL ?? "gpt-4.1";

export async function POST(req: Request) {
    const supabase = await createClient();

    // Auth guard
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read body safely
    let body: any = null;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const runId: string | undefined = body?.runId ?? body?.auditRunId;
    if (!runId) {
        return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    // Engine switch (future n8n)
    const engine = process.env.ANALYSIS_ENGINE ?? "nextjs";
    if (engine === "n8n") {
        return NextResponse.json({ error: "n8n engine not wired yet" }, { status: 501 });
    }

    try {
        // Fetch audit run (owned by user)
        const { data: run, error: fetchError } = await supabase
            .from("audit_runs")
            .select("id, status, intake, prompt_version, schema_version, model")
            .eq("id", runId)
            .eq("user_id", auth.user.id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!run) {
            return NextResponse.json({ error: "Audit run not found" }, { status: 404 });
        }

        const intake = run.intake;

        // Guard: already analyzing
        if (run.status === "analyzing") {
            return NextResponse.json({ error: "Run is already analyzing." }, { status: 409 });
        }

        // Guard: only allow submitted or retry from error
        if (run.status !== "submitted" && run.status !== "error") {
            return NextResponse.json(
                { error: `Run not ready for analysis (status: ${run.status})` },
                { status: 409 }
            );
        }

        // Mark analyzing
        const { error: markError } = await supabase
            .from("audit_runs")
            .update({ status: "analyzing", error: null, error_stage: null })
            .eq("id", runId)
            .eq("user_id", auth.user.id);

        if (markError) {
            return NextResponse.json({ error: markError.message }, { status: 500 });
        }

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: buildAuditPrompt(intake),
        });

        const content = completion.choices[0]?.message?.content ?? "{}";

        let result: any;
        try {
            result = JSON.parse(content);
        } catch {
            throw new Error("Model returned invalid JSON.");
        }

        // ---- HARD GUARANTEE: always have business_summary (for Findings UI) ----
        // If the model didn’t return it, derive it from operational_context or set a safe fallback.
        const derivedSummary =
            result?.operational_context?.overview ??
            result?.summary ??
            result?.executive_summary ??
            null;

        if (!result.business_summary) {
            result.business_summary = {
                one_liner: typeof derivedSummary === "string" ? derivedSummary.slice(0, 140) : "Audit completed.",
                description:
                    typeof derivedSummary === "string"
                        ? derivedSummary
                        : "Business summary was not generated. (Needs prompt tuning.)",
            };
        } else if (typeof result.business_summary === "string") {
            // If model returns it as a string, normalize to object (your code expects object sometimes)
            result.business_summary = {
                one_liner: result.business_summary.slice(0, 140),
                description: result.business_summary,
            };
        } else {
            // Ensure required subfields exist
            result.business_summary.one_liner =
                result.business_summary.one_liner ??
                (typeof result.business_summary.description === "string"
                    ? result.business_summary.description.slice(0, 140)
                    : "Audit completed.");
            result.business_summary.description =
                result.business_summary.description ??
                (typeof derivedSummary === "string" ? derivedSummary : "Audit completed.");
        }

        // Minimal contract validation (aligned with prompt schema)
        const requiredTopKeys = ["business_summary", "assumptions", "findings", "recommendations", "operational_context"];
        for (const key of requiredTopKeys) {
            if (!(key in result)) {
                throw new Error(`Result JSON missing required key: ${key}`);
            }
        }

        const summary =
            result?.business_summary?.one_liner ??
            result?.business_summary?.description ??
            "Audit completed successfully.";

        // Save result
        const { error: saveError } = await supabase
            .from("audit_runs")
            .update({
                status: "analyzed",
                result,
                summary,
                error: null,
                analyzed_at: new Date().toISOString(),
                model: MODEL, // keep traceability
            })
            .eq("id", runId)
            .eq("user_id", auth.user.id);

        if (saveError) {
            return NextResponse.json({ error: saveError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, runId });
    } catch (err: any) {
        const message = err?.message ?? "Unknown error";

        await supabase
            .from("audit_runs")
            .update({
                status: "error",
                error: message,
            })
            .eq("id", runId)
            .eq("user_id", auth.user.id);

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function buildAuditPrompt(intake: any) {
    return [
        {
            role: "system" as const,
            content: `
You are an AI operations auditor.
You analyze how work flows through a business.
Do NOT guess missing information.
If something is unclear, state assumptions explicitly.
Return ONLY valid JSON with the exact schema requested.
`.trim(),
        },
        {
            role: "user" as const,
            content: `
Return JSON with this exact shape:

{
  "business_summary": {
    "one_liner": "string (max ~140 chars)",
    "description": "string (2-5 sentences)"
  },
  "operational_context": {
    "overview": "1–2 paragraph description of how the business currently operates, based strictly on intake evidence"
  },
  "assumptions": ["string", "..."],
  "findings": [
    {
      "dimension": "Intake quality | Manual decision points | Data duplication | Repetitive communication | Knowledge reuse | Error or compliance risk | Human effort vs system effort",
      "what_we_observed": "string",
      "why_it_matters": "string",
      "evidence_from_intake": ["string", "..."],
      "risk_level": "low | medium | high"
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "impact": "low | medium | high",
      "effort": "low | medium | high",
      "why": "string",
      "steps": ["string", "..."],
      "tools_or_assets": ["string", "..."]
    }
  ]
}

Analyze this intake using these dimensions:
- Intake quality
- Manual decision points
- Data duplication
- Repetitive communication
- Knowledge reuse
- Error or compliance risk
- Human effort vs system effort

INTAKE:
${JSON.stringify(intake ?? {}, null, 2)}
`.trim(),
        },
    ];
}

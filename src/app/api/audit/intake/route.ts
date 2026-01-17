import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const intake = body?.intake;

    if (!intake || typeof intake !== "object" || Array.isArray(intake)) {
        return NextResponse.json({ error: "Missing intake data" }, { status: 400 });
    }

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create a run ONLY on submit.
    // IMPORTANT: Do NOT send created_at/updated_at. DB defaults must handle timestamps.
    const { data: created, error: insertError } = await supabase
        .from("audit_runs")
        .insert({
            user_id: user.id,
            status: "submitted",
            intake,
        })
        .select("id")
        .single();

    if (insertError || !created) {
        // Helpful server log during debugging (won't show in client UI)
        console.error("Failed to create audit run", {
            message: insertError?.message,
            details: (insertError as any)?.details,
            hint: (insertError as any)?.hint,
            code: (insertError as any)?.code,
        });

        return NextResponse.json(
            { error: insertError?.message ?? "Failed to create audit run" },
            { status: 500 }
        );
    }

    return NextResponse.json({ runId: created.id }, { status: 200 });
}

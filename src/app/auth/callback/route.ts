import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", auth.user.id)
        .maybeSingle();

    const dest =
        profile?.onboarding_completed === true ? "/dashboard" : "/dashboard/onboarding";

    return NextResponse.redirect(new URL(dest, req.url));
}

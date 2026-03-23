import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT
);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // 1. Generate recovery link
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
            },
        });

        if (error || !data?.properties?.action_link) {
            return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
        }

        const resetLink = data.properties.action_link;

        // 2. Send email via Resend
        await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: email,
            subject: "Reset your password",
            html: `
                <div style="font-family: Arial; max-width: 500px;">
                    <h2>Reset your password</h2>
                    <p>We received a request to reset your password.</p>
                    <p>
                        <a href="${resetLink}" style="background:#000;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
                            Reset Password
                        </a>
                    </p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                    <p>— Kalibri</p>
                </div>
            `,
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
// THIS FILE IS  the outbound SMS helper.

import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Missing Twilio environment variables");
}

const client = Twilio(accountSid, authToken);

export async function sendSms({
    to,
    body,
}: {
    to: string;
    body: string;
}): Promise<{ ok: true; sid: string } | { ok: false; error: string }> {
    try {
        const msg = await client.messages.create({
            to,
            from: fromNumber,
            body,
        });

        return { ok: true, sid: msg.sid };
    } catch (err: any) {
        return {
            ok: false,
            error: err?.message ?? "Twilio send failed",
        };
    }
}

import Twilio from "twilio";

type TwilioEnv = {
    accountSid: string;
    authToken: string;
    fromNumber: string;
};

function getTwilioEnv(): TwilioEnv {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Missing Twilio environment variables");
    }

    return { accountSid, authToken, fromNumber };
}

// Lazy init so builds and non-SMS paths never crash
let _client: ReturnType<typeof Twilio> | null = null;

function getTwilioClient() {
    if (_client) return _client;
    const { accountSid, authToken } = getTwilioEnv();
    _client = Twilio(accountSid, authToken);
    return _client;
}

/**
 * Sends an SMS using Twilio.
 * - Safe for build time (no env checks at module import).
 * - Throws at runtime if Twilio env vars are missing.
 */
export async function sendSms(to: string, body: string) {
    const { fromNumber } = getTwilioEnv();
    const client = getTwilioClient();

    return await client.messages.create({
        to,
        from: fromNumber,
        body,
    });
}

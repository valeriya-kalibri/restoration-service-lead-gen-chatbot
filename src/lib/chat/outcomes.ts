export const OUTCOMES = [
    "call_initiated",
    "callback_requested",
    "lead_captured",
    "abandoned",
    "unknown",
] as const;

export type ChatOutcome = (typeof OUTCOMES)[number];

export function isChatOutcome(x: unknown): x is ChatOutcome {
    return typeof x === "string" && (OUTCOMES as readonly string[]).includes(x);
}

export const OUTCOME_LABEL: Record<ChatOutcome, string> = {
    call_initiated: "Call initiated",
    callback_requested: "Callback requested",
    lead_captured: "Lead captured",
    abandoned: "Abandoned",
    unknown: "Unknown",
};

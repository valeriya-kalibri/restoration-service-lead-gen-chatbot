export const LEAD_STATUSES = [
    "lead_captured",
    "lead_not_captured",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(x: unknown): x is LeadStatus {
    return typeof x === "string" && (LEAD_STATUSES as readonly string[]).includes(x);
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
    lead_captured: "Lead captured",
    lead_not_captured: "Lead not captured",
};

export const ACTION_OUTCOMES = [
    "call_initiated",
    "callback_requested",
    "sms_initiated",
    "unknown",
] as const;

export type ActionOutcome = (typeof ACTION_OUTCOMES)[number];

export function isActionOutcome(x: unknown): x is ActionOutcome {
    return typeof x === "string" && (ACTION_OUTCOMES as readonly string[]).includes(x);
}

export const ACTION_OUTCOME_LABEL: Record<ActionOutcome, string> = {
    call_initiated: "Call initiated",
    callback_requested: "Callback requested",
    sms_initiated: "SMS initiated",
    unknown: "Unknown",
};
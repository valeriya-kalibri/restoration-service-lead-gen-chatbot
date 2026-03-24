export const STEP_LABELS: Record<string, string> = {
    q1_inquiry: "Issue Type",
    q2_timing: "Is it happening now?",
    q3_location: "Location",
    q4_contact: "Contact Details",
    q5_description: "Damage Description",
};

export function getStepLabel(step: string): string {
    return STEP_LABELS[step] ?? step;
}
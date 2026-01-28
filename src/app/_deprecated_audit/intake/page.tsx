"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function IntakePage() {
    const router = useRouter();

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        business_overview: "",
        roles_and_approvals: "",
        request_channels: "",
        definition_of_done: "",
        workflow_steps: "",
        workflow_breakdowns: "",
        systems_of_record: "",
        data_quality: "",
        highest_volume_work: "",
        risk_and_controls: "",
    });

    function updateField(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/audit/intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ✅ No runId. DB row is created ONLY on submit.
                body: JSON.stringify({ intake: form }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json?.error ?? "Failed to submit intake.");
            }

            // json.runId is returned by the new endpoint (useful later)
            router.push("/dashboard/findings");
            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to submit intake.");
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div className="space-y-3 text-center">
                <h1 className="text-lg font-bold text-primary">Operational Intake</h1>

                <p className="text-sm text-muted-foreground">
                    Be specific and honest—your answers directly determine the accuracy of
                    your audit and recommendations. Answer with real examples where
                    possible. Vague answers create vague findings.
                </p>

                <p className="text-xs text-muted-foreground">
                    Estimated time: 5–10 minutes. Bullet points are perfectly fine.
                </p>
            </div>

            <div className="space-y-4">
                <Textarea
                    label="Who do you serve and what do you deliver?"
                    helper="1–2 sentences. Include the service + typical deliverables."
                    value={form.business_overview}
                    onChange={(v) => updateField("business_overview", v)}
                    placeholder="e.g. Fractional CFO for SaaS (monthly close, forecasting, board reporting)"
                />

                <Textarea
                    label="Who touches delivery work, and who approves final outputs?"
                    helper="List roles (not names). Include who signs off before it goes to the client."
                    value={form.roles_and_approvals}
                    onChange={(v) => updateField("roles_and_approvals", v)}
                    placeholder="e.g. Analyst builds → CFO reviews → Client approves"
                />

                <Textarea
                    label="Where do requests usually enter your business?"
                    helper="List channels and mark the primary one."
                    value={form.request_channels}
                    onChange={(v) => updateField("request_channels", v)}
                    placeholder="e.g. Email (primary), occasional Slack, monthly call notes"
                />

                <Textarea
                    label="What counts as a complete request? What information is often missing?"
                    helper="Answer in bullets. Include required info + the top 2 missing items."
                    value={form.definition_of_done}
                    onChange={(v) => updateField("definition_of_done", v)}
                    placeholder="e.g. Complete request includes: client name, period, scope, deadline. Missing: access to books, prior month files."
                />

                <Textarea
                    label="Walk through what happens from request to delivery"
                    helper="Write steps in order. Include handoffs + decision points."
                    value={form.workflow_steps}
                    onChange={(v) => updateField("workflow_steps", v)}
                    placeholder="e.g. 1) Intake email → 2) Create task → 3) Pull data → 4) Draft report → 5) Review → 6) Deliver"
                />

                <Textarea
                    label="Where does this process break or slow down?"
                    helper="List the top 3 failure points and what causes them."
                    value={form.workflow_breakdowns}
                    onChange={(v) => updateField("workflow_breakdowns", v)}
                    placeholder="e.g. Waiting on client docs, unclear scope, review bottleneck, rework due to formatting"
                />

                <Textarea
                    label="What tools hold the source of truth for your work?"
                    helper="List systems + what each one is used for."
                    value={form.systems_of_record}
                    onChange={(v) => updateField("systems_of_record", v)}
                    placeholder="e.g. QuickBooks (books), Google Drive (docs), Notion (tasks), Excel (models)"
                />

                <Textarea
                    label="How do inputs arrive, and how clean are they?"
                    helper="Mention formats + consistency. Call out messy areas."
                    value={form.data_quality}
                    onChange={(v) => updateField("data_quality", v)}
                    placeholder="e.g. Bank statements PDF, receipts via email, spreadsheets inconsistent columns; frequent missing categories"
                />

                <Textarea
                    label="What work repeats most often and consumes the most time?"
                    helper="Name the recurring work + frequency + weekly hours."
                    value={form.highest_volume_work}
                    onChange={(v) => updateField("highest_volume_work", v)}
                    placeholder="e.g. Monthly close (weekly 6–10 hrs), AP approvals (daily 1 hr), client reporting (weekly 2 hrs)"
                />

                <Textarea
                    label="Any confidentiality, compliance, approval, or audit-trail requirements?"
                    helper="Mention client expectations, internal controls, approvals, and whether you need traceability."
                    value={form.risk_and_controls}
                    onChange={(v) => updateField("risk_and_controls", v)}
                    placeholder="e.g. NDA, SOC2 clients, approvals required before sending reports, changes must be traceable"
                />
            </div>

            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-center">
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting…" : "Submit Intake"}
                </Button>
            </div>
        </div>
    );
}

function Textarea({
    label,
    helper,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    helper?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-semibold text-primary">{label}</label>

            {helper ? <div className="text-xs text-muted-foreground">{helper}</div> : null}

            <textarea
                className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}


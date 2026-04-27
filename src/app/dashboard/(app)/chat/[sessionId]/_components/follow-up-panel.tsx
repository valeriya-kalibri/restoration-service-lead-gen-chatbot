"use client";

import { useState, useTransition } from "react";
import { updateFollowUp } from "../_actions/update-follow-up";
import { Check } from "lucide-react";

export const FOLLOW_UP_STATUSES = [
    { key: "new",       label: "New",       className: "border-primary/40 bg-primary/10 text-primary" },
    { key: "called",    label: "Called",    className: "border-purple-200 bg-purple-50 text-purple-700" },
    { key: "voicemail", label: "Voicemail", className: "border-orange-200 bg-orange-50 text-orange-700" },
    { key: "scheduled", label: "Scheduled", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { key: "closed",    label: "Closed",    className: "border-border bg-muted text-muted-foreground" },
];

type Props = {
    sessionId: string;
    initialStatus: string;
    initialNotes: string;
};

export function FollowUpPanel({ sessionId, initialStatus, initialNotes }: Props) {
    const [status, setStatus] = useState(initialStatus || "new");
    const [notes, setNotes] = useState(initialNotes || "");
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        setError(null);
        setSaved(false);
        startTransition(async () => {
            try {
                await updateFollowUp(sessionId, status, notes);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } catch (e: any) {
                setError(e?.message ?? "Failed to save");
            }
        });
    }

    return (
        <div className="rounded-xl border bg-indigo-50 p-5 space-y-4">
            <div>
                <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Follow up status</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Track your progress on this lead.</p>
            </div>

            {/* Status picker */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-1.5">
                    {FOLLOW_UP_STATUSES.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setStatus(s.key)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                                status === s.key
                                    ? s.className + " ring-2 ring-offset-1 ring-primary/30"
                                    : "border-border bg-white text-muted-foreground hover:border-primary/40"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="text-xs text-muted-foreground/60">Each save overwrites the previous note.</p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Left voicemail, call back Thursday 2pm…"
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                    {isPending ? "Saving…" : "Save"}
                </button>
                {saved && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Saved
                    </span>
                )}
                {error && (
                    <span className="text-xs text-destructive">{error}</span>
                )}
            </div>
        </div>
    );
}
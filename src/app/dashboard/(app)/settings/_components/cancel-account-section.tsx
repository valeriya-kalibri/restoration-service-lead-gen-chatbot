"use client";

import { useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const inputClass =
    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

interface Props {
    cancelAccount: (formData: FormData) => Promise<void>;
    cancelled: boolean;
    cancelledAt: string | null;
    cancelReason: string | null;
}

export function CancelAccountSection({ cancelAccount, cancelled, cancelledAt, cancelReason }: Props) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleConfirm() {
        const formData = new FormData();
        formData.set("cancel_reason", reason);
        startTransition(async () => {
            await cancelAccount(formData);
        });
    }

    if (cancelled) {
        return (
            <div className="rounded-xl border bg-white px-4 py-3 text-sm space-y-1">
                <div>
                    Status: <span className="font-semibold text-destructive">Cancelled</span>
                </div>
                {cancelledAt && (
                    <div className="text-muted-foreground">
                        Cancelled at:{" "}
                        <span className="font-medium text-foreground">
                            {new Date(cancelledAt).toLocaleString()}
                        </span>
                    </div>
                )}
                {cancelReason && (
                    <div className="text-muted-foreground">
                        Reason:{" "}
                        <span className="font-medium text-foreground">{cancelReason}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Cancellation reason (optional)
                    </label>
                    <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Not ready yet / Budget / Just testing"
                        className={inputClass}
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="bg-white border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => setOpen(true)}
                >
                    Cancel account
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    {/* Header */}
                    <div className="bg-destructive/10 px-6 pt-5 pb-4 border-b border-destructive/20">
                        <div className="flex items-center gap-2">
                            <TriangleAlert className="h-5 w-5 text-destructive shrink-0" />
                            <DialogTitle className="text-base font-bold text-destructive">
                                Cancel your account?
                            </DialogTitle>
                        </div>
                        <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                            This will disable your dashboard access and stop all SMS alerts.
                            Your chat history will be kept and you can reactivate at any time.
                        </DialogDescription>
                    </div>

                    {/* Body */}
                    <div className="bg-white px-6 py-5 space-y-4">
                        {reason && (
                            <p className="text-sm text-muted-foreground">
                                Reason:{" "}
                                <span className="font-medium text-foreground">{reason}</span>
                            </p>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                            >
                                Keep my account
                            </Button>
                            <Button
                                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                                onClick={handleConfirm}
                                disabled={isPending}
                            >
                                {isPending ? "Cancelling…" : "Yes, cancel"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
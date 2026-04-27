"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/40 transition-colors"
        >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
        </button>
    );
}
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const TYPES = [
    { value: "", label: "All" },
    { value: "water", label: "Water" },
    { value: "fire", label: "Fire" },
    { value: "mold", label: "Mold" },
    { value: "not_sure", label: "Not sure" },
] as const;

const DATES = [
    { value: "", label: "All time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
] as const;

export function ChatFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeType = searchParams.get("type") ?? "";
    const activeDate = searchParams.get("date") ?? "";

    const set = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="flex flex-wrap gap-4">
            {/* Inquiry type */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Damage type
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {TYPES.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => set("type", value)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                activeType === value
                                    ? "border-primary bg-primary text-white"
                                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date range */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {DATES.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => set("date", value)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                activeDate === value
                                    ? "border-primary bg-primary text-white"
                                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
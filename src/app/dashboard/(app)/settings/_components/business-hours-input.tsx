"use client";

import { useState } from "react";

const DAYS = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

interface DayConfig {
    open: boolean;
    from: string;
    to: string;
}

type HoursConfig = Record<DayKey, DayConfig>;

const DEFAULT_HOURS: HoursConfig = {
    mon: { open: true, from: "08:00", to: "17:00" },
    tue: { open: true, from: "08:00", to: "17:00" },
    wed: { open: true, from: "08:00", to: "17:00" },
    thu: { open: true, from: "08:00", to: "17:00" },
    fri: { open: true, from: "08:00", to: "17:00" },
    sat: { open: false, from: "08:00", to: "12:00" },
    sun: { open: false, from: "08:00", to: "12:00" },
};

export function BusinessHoursInput({
    defaultValue,
    disabled,
}: {
    defaultValue?: string | null;
    disabled?: boolean;
}) {
    const [hours, setHours] = useState<HoursConfig>(() => {
        if (defaultValue) {
            try {
                return { ...DEFAULT_HOURS, ...JSON.parse(defaultValue) };
            } catch {
                // fall through to default
            }
        }
        return DEFAULT_HOURS;
    });

    function update(day: DayKey, field: keyof DayConfig, value: string | boolean) {
        setHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    }

    return (
        <div className="space-y-1">
            <input type="hidden" name="business_hours" value={JSON.stringify(hours)} />
            <div className="rounded-lg border bg-white divide-y text-sm overflow-hidden">
                {DAYS.map(({ key, label }) => {
                    const day = hours[key];
                    return (
                        <div key={key} className="flex items-center gap-3 px-3 py-2">
                            <label className="flex items-center gap-2 w-20 shrink-0 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={day.open}
                                    onChange={(e) => update(key, "open", e.target.checked)}
                                    disabled={disabled}
                                    className="rounded"
                                />
                                <span
                                    className={
                                        day.open
                                            ? "font-medium text-foreground"
                                            : "text-muted-foreground"
                                    }
                                >
                                    {label}
                                </span>
                            </label>

                            {day.open ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={day.from}
                                        onChange={(e) => update(key, "from", e.target.value)}
                                        disabled={disabled}
                                        className="h-7 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                    />
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <input
                                        type="time"
                                        value={day.to}
                                        onChange={(e) => update(key, "to", e.target.value)}
                                        disabled={disabled}
                                        className="h-7 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                    />
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">Closed</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
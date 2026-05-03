"use client";

import { useState } from "react";

function isValidHex(val: string) {
    return /^#[0-9A-Fa-f]{6}$/.test(val);
}

const inputClass =
    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";

export function BrandColorInput({
    defaultValue,
    disabled,
}: {
    defaultValue?: string;
    disabled?: boolean;
}) {
    const [color, setColor] = useState(defaultValue ?? "#2563eb");
    const valid = isValidHex(color);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div
                    className="h-9 w-9 shrink-0 rounded-lg border transition-colors"
                    style={{ background: valid ? color : "#e5e7eb" }}
                />
                <input
                    name="primary_color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#2563eb"
                    className={inputClass}
                    maxLength={7}
                    disabled={disabled}
                />
                <input
                    type="color"
                    value={valid ? color : "#2563eb"}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={disabled}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border p-0.5 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Open color picker"
                />
            </div>
            {color && !valid && (
                <p className="text-xs text-destructive">
                    Enter a valid hex color, e.g. <span className="font-mono">#2563eb</span>
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                Appears in the widget header and buttons. Type a hex code or use the color picker.
            </p>
        </div>
    );
}
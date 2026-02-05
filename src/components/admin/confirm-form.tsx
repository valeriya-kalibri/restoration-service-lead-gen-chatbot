"use client";

import * as React from "react";

type Props = {
    action: (formData: FormData) => void | Promise<void>;
    message: string;
    children: React.ReactNode;
    className?: string;
};

export function ConfirmForm({ action, message, children, className }: Props) {
    return (
        <form
            action={action}
            className={className}
            onSubmit={(e) => {
                // native browser confirm
                if (!window.confirm(message)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            {children}
        </form>
    );
}

import * as React from "react";



function isRecord(v: unknown): v is Record<string, any> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pretty(v: any) {
    try {
        return JSON.stringify(v ?? null, null, 2);
    } catch {
        return String(v);
    }
}

function Title({ children }: { children: React.ReactNode }) {
    return <div className="text-base font-semibold">{children}</div>;
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Title>{title}</Title>
            <div className="rounded-lg border bg-background p-4 shadow-sm">{children}</div>
        </div>
    );
}

function ListOfObjects({ items }: { items: any[] }) {
    return (
        <div className="space-y-3">
            {items.map((it, idx) => (
                <div key={idx} className="rounded-lg border bg-muted/20 p-3">
                    {isRecord(it) ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {Object.entries(it).map(([k, v]) => (
                                <div key={k}>
                                    <div className="text-xs font-medium text-muted-foreground">{k}</div>
                                    <div className="text-sm whitespace-pre-wrap">{String(v ?? "—")}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm whitespace-pre-wrap">{String(it)}</div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ListOfStrings({ items }: { items: any[] }) {
    return (
        <ul className="list-disc pl-5 text-sm space-y-1">
            {items.map((x, i) => (
                <li key={i} className="whitespace-pre-wrap">
                    {String(x)}
                </li>
            ))}
        </ul>
    );
}

export function AuditResultRenderer({
    result,
}: {
    result: unknown;
}) {
    // Unknown / empty
    if (result == null) {
        return (
            <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                No result saved for this run yet.
            </div>
        );
    }

    // Non-object (string/number/etc.)
    if (!isRecord(result)) {
        return (
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm whitespace-pre-wrap">{String(result)}</div>
            </div>
        );
    }

    const r = result as Record<string, any>;

    // Try “nice” known sections first (safe + optional)
    const knownOrder: Array<{ key: string; title: string }> = [
        { key: "executive_summary", title: "Executive Summary" },
        { key: "summary", title: "Summary" },
        { key: "context", title: "Context" },
        { key: "findings", title: "Findings" },
        { key: "risks", title: "Risks" },
        { key: "recommendations", title: "Recommendations" },
        { key: "quick_wins", title: "Quick Wins" },
        { key: "roadmap", title: "Roadmap" },
        { key: "kpis", title: "KPIs" },
        { key: "next_steps", title: "Next Steps" },
    ];

    const hasKnown = knownOrder.some(({ key }) => r[key] != null);

    if (hasKnown) {
        return (
            <div className="space-y-4">
                {knownOrder.map(({ key, title }) => {
                    const val = r[key];
                    if (val == null) return null;

                    // String
                    if (typeof val === "string") {
                        return (
                            <Section key={key} title={title}>
                                <div className="text-sm whitespace-pre-wrap">{val}</div>
                            </Section>
                        );
                    }

                    // Array
                    if (Array.isArray(val)) {
                        const allStrings = val.every((x) => typeof x === "string" || typeof x === "number");
                        return (
                            <Section key={key} title={title}>
                                {allStrings ? (
                                    <ListOfStrings items={val} />
                                ) : (
                                    <ListOfObjects items={val} />
                                )}
                            </Section>
                        );
                    }

                    // Object
                    if (isRecord(val)) {
                        return (
                            <Section key={key} title={title}>
                                <div className="space-y-2">
                                    {Object.entries(val).map(([k, v]) => (
                                        <div key={k}>
                                            <div className="text-xs font-medium text-muted-foreground">{k}</div>
                                            <div className="text-sm whitespace-pre-wrap">
                                                {typeof v === "string" ? v : Array.isArray(v) ? pretty(v) : String(v ?? "—")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        );
                    }

                    // Fallback
                    return (
                        <Section key={key} title={title}>
                            <pre className="text-xs overflow-auto">{pretty(val)}</pre>
                        </Section>
                    );
                })}
            </div>
        );
    }

    // If result is an object but doesn’t match known keys:
    // render as a readable list of sections per top-level key.
    return (
        <div className="space-y-4">
            {Object.entries(r).map(([k, v]) => (
                <Section key={k} title={k}>
                    <pre className="text-xs overflow-auto">{pretty(v)}</pre>
                </Section>
            ))}
        </div>
    );
}

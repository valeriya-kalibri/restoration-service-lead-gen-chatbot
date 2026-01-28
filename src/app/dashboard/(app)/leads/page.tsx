import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
    searchParams?: Promise<{ range?: string; inquiry?: string }>;
};

type LeadRow = {
    id: string;
    created_at: string;
    inquiry_type: string | null;
    city: string | null;
    zip: string | null;
    lead_name: string | null;
    lead_phone: string | null;
    lead_email: string | null;
    outcome: string | null;
};

function clampRange(raw: string | undefined) {
    if (raw === "7d") return { key: "7d", days: 7, label: "Last 7 days" };
    if (raw === "90d") return { key: "90d", days: 90, label: "Last 90 days" };
    return { key: "30d", days: 30, label: "Last 30 days" };
}

function fmtOutcome(outcome: string | null) {
    if (!outcome) return "—";
    return outcome.replaceAll("_", " ");
}

export default async function LeadsPage({ searchParams }: PageProps) {
    const sp = (await searchParams) ?? {};
    const range = clampRange(sp.range);

    const inquiry = (sp.inquiry ?? "all").toLowerCase();
    const allowedInquiry = new Set(["all", "water", "fire", "mold", "not_sure"]);
    const inquiryFilter = allowedInquiry.has(inquiry) ? inquiry : "all";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Leads</h1>
                <p className="text-sm text-muted-foreground">Please log in.</p>
            </div>
        );
    }

    const since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString();

    let q = supabase
        .from("chat_sessions")
        .select("id, created_at, inquiry_type, city, zip, lead_name, lead_phone, lead_email, outcome")
        .gte("created_at", since)
        .not("lead_phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(5000);

    if (inquiryFilter !== "all") {
        q = q.eq("inquiry_type", inquiryFilter);
    }

    const { data, error } = await q.returns<LeadRow[]>();

    if (error) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Leads</h1>
                <div className="rounded-md border p-3 text-sm">Error loading leads: {error.message}</div>
            </div>
        );
    }

    const leads = Array.isArray(data) ? data : [];

    const rangeLinks = [
        { key: "7d", label: "7d" },
        { key: "30d", label: "30d" },
        { key: "90d", label: "90d" },
    ];

    return (
        <div className="space-y-6">
            {/* Header + filters */}
            <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
                <div className="space-y-2">
                    <h1 className="text-lg font-semibold">Leads</h1>
                    <p className="text-sm text-muted-foreground">
                        {range.label}
                        {inquiryFilter !== "all" ? ` • Inquiry: ${inquiryFilter.replace("_", " ")}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Shows sessions where a visitor submitted contact info (name/phone/email).
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-9">
                    {/* Range */}
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">Range</div>
                        <div className="flex overflow-hidden rounded-md border">
                            {rangeLinks.map((r) => {
                                const active = r.key === range.key;
                                return (
                                    <Link
                                        key={r.key}
                                        href={`/dashboard/leads?range=${r.key}&inquiry=${inquiryFilter}`}
                                        className={`px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                                            }`}
                                    >
                                        {r.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Inquiry */}
                    <div className="flex items-center gap-2 ml-6">
                        <div className="text-xs text-muted-foreground">Inquiry</div>
                        <div className="flex overflow-hidden rounded-md border">
                            {[
                                { key: "all", label: "All" },
                                { key: "water", label: "Water" },
                                { key: "fire", label: "Fire" },
                                { key: "mold", label: "Mold" },
                                { key: "not_sure", label: "Not sure" },
                            ].map((opt) => {
                                const active = opt.key === inquiryFilter;
                                return (
                                    <Link
                                        key={opt.key}
                                        href={`/dashboard/leads?range=${range.key}&inquiry=${opt.key}`}
                                        className={`px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                                            }`}
                                    >
                                        {opt.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <div className="px-4 py-3 border-b">
                    <div className="text-sm font-semibold">Captured leads</div>
                    <div className="text-xs text-muted-foreground">{leads.length} results</div>
                </div>

                {leads.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No leads captured in this time range.</div>
                ) : (
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr className="text-left">
                                    <th className="px-4 py-2 whitespace-nowrap">Created</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Inquiry</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Location</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Name</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Phone</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Email</th>
                                    <th className="px-4 py-2 whitespace-nowrap">Outcome</th>
                                    <th className="px-4 py-2 whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((l) => (
                                    <tr key={l.id} className="border-t">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {new Date(l.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">{l.inquiry_type ?? "—"}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {l.city || l.zip ? `${l.city ?? ""} ${l.zip ?? ""}` : "—"}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">{l.lead_name ?? "—"}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{l.lead_phone ?? "—"}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{l.lead_email ?? "—"}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{fmtOutcome(l.outcome)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            <Link
                                                className="text-primary hover:underline"
                                                href={`/dashboard/chat/${l.id}`}
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Droplets, Flame, Wind, HelpCircle, Phone, Mail, MapPin } from "lucide-react";

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
    follow_up_status: string | null;
};

function clampRange(raw: string | undefined) {
    if (raw === "7d") return { key: "7d", days: 7, label: "Last 7 days" };
    if (raw === "90d") return { key: "90d", days: 90, label: "Last 90 days" };
    return { key: "30d", days: 30, label: "Last 30 days" };
}

const RANGES = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
];

const INQUIRY_OPTS = [
    { key: "all", label: "All" },
    { key: "water", label: "Water" },
    { key: "fire", label: "Fire" },
    { key: "mold", label: "Mold" },
    { key: "not_sure", label: "Not sure" },
];

function inquiryBadge(value: string | null) {
    switch (value) {
        case "water": return { label: "Water", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Droplets };
        case "fire":  return { label: "Fire",  className: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame };
        case "mold":  return { label: "Mold",  className: "bg-green-50 text-green-700 border-green-200", icon: Wind };
        default:      return { label: value ? value.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border", icon: HelpCircle };
    }
}

function followUpBadge(value: string | null) {
    switch (value) {
        case "called":    return { label: "Called",    className: "border-purple-200 bg-purple-50 text-purple-700" };
        case "voicemail": return { label: "Voicemail", className: "border-orange-200 bg-orange-50 text-orange-700" };
        case "scheduled": return { label: "Scheduled", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
        case "closed":    return { label: "Closed",    className: "border-border bg-muted text-muted-foreground" };
        default:          return { label: "New",       className: "border-primary/40 bg-primary/10 text-primary" };
    }
}

function outcomeBadge(value: string | null) {
    switch (value) {
        case "lead_captured":      return { label: "Lead captured",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "callback_requested": return { label: "Callback requested", className: "bg-blue-50 text-blue-700 border-blue-200" };
        case "call_initiated":     return { label: "Call initiated",     className: "bg-purple-50 text-purple-700 border-purple-200" };
        case "abandoned":          return { label: "Abandoned",          className: "bg-red-50 text-red-600 border-red-200" };
        default:                   return { label: value ? value.replace(/_/g, " ") : "—", className: "bg-muted text-muted-foreground border-border" };
    }
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
        .select("id, created_at, inquiry_type, city, zip, lead_name, lead_phone, lead_email, outcome, follow_up_status")
        .gte("created_at", since)
        .not("lead_phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(5000);

    if (inquiryFilter !== "all") q = q.eq("inquiry_type", inquiryFilter);

    const { data, error } = await q;

    if (error) {
        return (
            <div className="space-y-2">
                <h1 className="text-lg font-semibold">Leads</h1>
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Error loading leads: {error.message}
                </div>
            </div>
        );
    }

    const leads: LeadRow[] = Array.isArray(data) ? data as LeadRow[] : [];

    return (
        <div className="space-y-5">
            {/* Banner */}
            <div className="rounded-xl bg-primary px-6 py-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1">
                        Captured contacts
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                    <p className="mt-1 text-sm text-white/70">
                        {range.label}{inquiryFilter !== "all" ? ` · ${inquiryFilter.replace("_", " ")}` : ""} — visitors who submitted their contact info.
                    </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Users className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-indigo-50 px-4 py-3 flex flex-wrap gap-6">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Range</p>
                    <div className="flex gap-1.5">
                        {RANGES.map((r) => (
                            <Link
                                key={r.key}
                                href={`/dashboard/leads?range=${r.key}&inquiry=${inquiryFilter}`}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    r.key === range.key
                                        ? "border-primary bg-primary text-white"
                                        : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                {r.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Damage type</p>
                    <div className="flex flex-wrap gap-1.5">
                        {INQUIRY_OPTS.map((opt) => (
                            <Link
                                key={opt.key}
                                href={`/dashboard/leads?range=${range.key}&inquiry=${opt.key}`}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    opt.key === inquiryFilter
                                        ? "border-primary bg-primary text-white"
                                        : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leads list */}
            {leads.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center space-y-2">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No leads captured in this period.</p>
                    <p className="text-xs text-muted-foreground/70">Try a wider date range or a different damage type.</p>
                </div>
            ) : (
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b bg-indigo-50">
                        <div>
                            <span className="text-sm font-bold text-foreground">Captured leads</span>
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{leads.length}</span>
                        </div>
                    </div>

                    <div className="divide-y">
                        {leads.map((l) => {
                            const inquiry = inquiryBadge(l.inquiry_type);
                            const outcome = outcomeBadge(l.outcome);
                            const followUp = followUpBadge(l.follow_up_status);
                            const InquiryIcon = inquiry.icon;
                            const location = [l.city, l.zip].filter(Boolean).join(" ") || null;

                            return (
                                <div key={l.id} className="group flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                                    {/* Left: name + date */}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary mt-0.5">
                                        {l.lead_name ? l.lead_name.charAt(0).toUpperCase() : "?"}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Row 1: name + badges */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                {l.lead_name ?? "Unknown"}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${inquiry.className}`}>
                                                <InquiryIcon className="h-3 w-3" />
                                                {inquiry.label}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${outcome.className}`}>
                                                {outcome.label}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${followUp.className}`}>
                                                {followUp.label}
                                            </span>
                                        </div>

                                        {/* Row 2: contact details */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                            {l.lead_phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {l.lead_phone}
                                                </span>
                                            )}
                                            {l.lead_email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {l.lead_email}
                                                </span>
                                            )}
                                            {location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {location}
                                                </span>
                                            )}
                                            <span className="text-muted-foreground/60">
                                                {new Date(l.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: view link */}
                                    <Link
                                        href={`/dashboard/chat/${l.id}`}
                                        className="shrink-0 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors mt-0.5"
                                    >
                                        View
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
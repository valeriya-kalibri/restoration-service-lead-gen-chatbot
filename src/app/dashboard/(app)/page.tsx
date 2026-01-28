import { createClient } from "@/lib/supabase/server";
import { AuditRunPanel } from "@/components/audit/audit-run-panel";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    let run: {
        id: string;
        status: string;
        summary: string | null;
        result: any | null;
        error: string | null;
    } | null = null;

    if (auth.user) {
        const { data } = await supabase
            .from("audit_runs")
            .select("id,status,summary,result,error,created_at")
            .eq("user_id", auth.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        run = data ?? null;
    }

    return (
        <div className="space-y-4">
            {/* Intro */}
            <div>
                <h1 className="text-xl font-semibold text-primary">
                    Welcome to your CHATBOT dashboard
                </h1>
                
            </div>

            {/* Process outline (MUST be inside return) */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-medium">What you can do in this dashboard</div>

                <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li>
                        <span className="font-medium text-foreground">1) View chat logs</span>
                        <div className="mt-1">
                            See every conversation, what the inquiry was about, where the user stopped,
                             and whether they booked or requested a call.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">2) Track conversions</span>
                        <div className="mt-1">
                            Understand how many chats turn into calls, callbacks, or bookings.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">3) Identify drop-off points</span>
                        <div className="mt-1">
                            See which question users leave on so you can improve your intake flow.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">4) Measure performance over time</span>
                        <div className="mt-1">
                            Use analytics to spot trends by day, issue type (water/fire/mold), and time of day.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">5) Update your settings</span>
                        <div className="mt-1">
                            Manage your contact info and notification preferences.
                        </div>
                    </li>
                </ol>
            </div>

            {/* Current run (temporary) */}
            {run ? (
                <AuditRunPanel auditRunId={run.id} status={run.status} />
            ) : (
                <div className="text-sm text-muted-foreground">No chat sessions yet.</div>
            )}
        </div>
    );
}

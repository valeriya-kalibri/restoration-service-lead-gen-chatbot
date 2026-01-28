import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    return (
        <div className="space-y-4">
            {/* Intro */}
            <div>
                <h1 className="text-xl font-semibold text-primary">
                    Welcome to your Chatbot Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Monitor conversations, leads, and performance from one place.
                </p>
            </div>

            {/* Process outline */}
            <div className="rounded-lg border bg-background p-4">
                <div className="text-sm font-medium">
                    What you can do in this dashboard
                </div>

                <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li>
                        <span className="font-medium text-foreground">1) View chat logs</span>
                        <div className="mt-1">
                            See every conversation, what the inquiry was about, where the user stopped,
                            and whether they requested a call or callback.
                        </div>
                    </li>

                    <li>
                        <span className="font-medium text-foreground">2) Track conversions</span>
                        <div className="mt-1">
                            Understand how many chats turn into calls or callbacks.
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
                            Use analytics to spot trends by issue type (water, fire, mold) and time of day.
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

            {/* Placeholder */}
            <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                No chat sessions yet. Once your chatbot goes live, activity will appear here.
            </div>
        </div>
    );
}

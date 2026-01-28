import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Admin</h1>
                <p className="text-sm text-muted-foreground">
                    View clients and troubleshoot chatbot activity, leads, and delivery status.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="space-y-2">
                        <div className="text-base font-semibold">Users</div>
                        <p className="text-sm text-muted-foreground">
                            Browse client profiles and onboarding status.
                        </p>
                        <Button asChild variant="default">
                            <Link href="/admin/users">Open Users</Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="space-y-2">
                        <div className="text-base font-semibold">Chatbot (Coming Next)</div>
                        <p className="text-sm text-muted-foreground">
                            We’ll add chat sessions, lead captures, drop-offs, and delivery logs here.
                        </p>
                        <Button variant="default" disabled>
                            Coming soon
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Admin</h1>
                <p className="text-sm text-muted-foreground">
                    View clients, audit runs, and audit outputs for troubleshooting and QA.
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
                        <div className="text-base font-semibold">Audit Runs</div>
                        <p className="text-sm text-muted-foreground">
                            See every run, intake submitted, results, and errors.
                        </p>
                        <Button asChild variant="default">
                            <Link href="/admin/runs">Open Runs</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

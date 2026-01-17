import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";



export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) redirect("/");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select(
            "email,full_name,business_name,phone,business_description,account_status,cancelled_at,cancel_reason"
        )
        .eq("id", auth.user.id)
        .single();

    if (error || !profile) {
        return (
            <div className="mx-auto w-full max-w-4xl space-y-2">
                <h1 className="text-xl font-semibold text-primary">Settings</h1>
                <p className="text-sm text-destructive">
                    Failed to load profile: {error?.message ?? "Unknown error"}
                </p>
            </div>
        );
    }

    async function saveProfile(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) redirect("/");

        const full_name = String(formData.get("full_name") ?? "").trim();
        const business_name = String(formData.get("business_name") ?? "").trim();
        const phone = String(formData.get("phone") ?? "").trim();
        const business_description = String(formData.get("business_description") ?? "").trim();

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: full_name.length ? full_name : null,
                business_name: business_name.length ? business_name : null,
                phone: phone.length ? phone : null,
                business_description: business_description.length ? business_description : null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);

        redirect("/dashboard/settings");
    }

    async function cancelAccount(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) redirect("/");

        const reason = String(formData.get("cancel_reason") ?? "").trim();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancel_reason: reason.length ? reason : null,
            })
            .eq("id", auth.user.id);

        if (error) throw new Error(error.message);

        await supabase.auth.signOut();
        redirect("/?cancelled=1");
    }

    const cancelled = profile.account_status === "cancelled";

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-primary">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Update your profile details used for audits.
                </p>
            </div>

            {/* Profile */}
            <div className="rounded-lg border bg-background p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">Profile</h2>
                    <p className="text-sm text-muted-foreground">
                        Keeping this accurate improves audit quality and reporting.
                    </p>
                </div>

                <div className="text-sm">
                    <div className="text-xs font-medium text-muted-foreground">Email</div>
                    <div>{profile.email ?? "—"}</div>
                </div>

                <form action={saveProfile} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Full name</label>
                        <input
                            name="full_name"
                            defaultValue={profile.full_name ?? ""}
                            placeholder="e.g., Valeriya Paine"
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            disabled={cancelled}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Business name</label>
                        <input
                            name="business_name"
                            defaultValue={profile.business_name ?? ""}
                            placeholder="e.g., Kalibri Studios"
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            disabled={cancelled}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Phone</label>
                        <input
                            name="phone"
                            defaultValue={profile.phone ?? ""}
                            placeholder="e.g., +1 (407) 555-0123"
                            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            disabled={cancelled}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Business description</label>
                        <textarea
                            name="business_description"
                            defaultValue={profile.business_description ?? ""}
                            placeholder="What do you sell, who do you serve, and what tools do you use today?"
                            className="min-h-[120px] w-full rounded-md border bg-transparent p-3 text-sm"
                            disabled={cancelled}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={cancelled}>
                            Save changes
                        </Button>
                        <Button asChild type="button" variant="outline">
                            <Link href="/dashboard">Back</Link>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Account */}
            <div className="rounded-lg border bg-background p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">Account</h2>
                    <p className="text-sm text-muted-foreground">
                        Canceling disables dashboard access but keeps your audit history.
                    </p>
                </div>

                {cancelled ? (
                    <div className="rounded-md bg-muted p-3 text-sm">
                        Account status: <span className="font-medium">Cancelled</span>
                        {profile.cancelled_at ? (
                            <>
                                <br />
                                Cancelled at:{" "}
                                <span className="font-medium">
                                    {new Date(profile.cancelled_at).toLocaleString()}
                                </span>
                            </>
                        ) : null}
                        {profile.cancel_reason ? (
                            <>
                                <br />
                                Reason: <span className="font-medium">{profile.cancel_reason}</span>
                            </>
                        ) : null}
                    </div>
                ) : (
                    <form action={cancelAccount} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Cancellation reason (optional)
                            </label>
                            <input
                                name="cancel_reason"
                                placeholder="e.g., Not ready yet / Budget / Just testing"
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            />
                        </div>

                        <Button type="submit" variant="outline">
                            Cancel account
                        </Button>
                    </form>
                )}
            </div>

          
        </div>
    );
}

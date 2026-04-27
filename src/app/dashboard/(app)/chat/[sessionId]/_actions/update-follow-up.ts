"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFollowUp(sessionId: string, followUpStatus: string, notes: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("chat_sessions")
        .update({ follow_up_status: followUpStatus, notes })
        .eq("id", sessionId)
        .eq("client_id", userData.user.id);

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/chat/${sessionId}`);
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard");
}
import { getServiceClient } from "./supabase/service";

interface NotifyInput {
  type: string;
  title: string;
  body: string;
  href?: string | null;
}

export async function notify(userId: string, input: NotifyInput): Promise<void> {
  const { error } = await getServiceClient().from("notifications").insert({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  });
  if (error) console.error("[notifications] insert failed", error.message);
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { checkBotPresence } from "@/lib/discord";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { guildId: string } }) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    await assertGuildAccess(session.user.id, params.guildId);

    const present = await checkBotPresence(params.guildId);
    if (present !== null) {
      await getServiceClient()
        .from("guilds")
        .update({ bot_present: present, bot_present_checked_at: new Date().toISOString() })
        .eq("id", params.guildId);
    }
    return NextResponse.json({ ok: true, botPresent: present });
  } catch (error) {
    return errorResponse(error);
  }
}

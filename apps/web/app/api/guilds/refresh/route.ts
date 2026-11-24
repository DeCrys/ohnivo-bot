import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { syncUserGuilds } from "@/lib/discord";
import { assertSameOrigin, errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const count = await syncUserGuilds(session.user.id, session.discordAccessToken);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    return errorResponse(error);
  }
}

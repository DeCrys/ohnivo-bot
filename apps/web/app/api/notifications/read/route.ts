import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { assertSameOrigin, errorResponse } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const { error } = await getServiceClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .is("read_at", null);
    if (error) throw new AppError("unknown", `Could not mark notifications: ${error.message}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

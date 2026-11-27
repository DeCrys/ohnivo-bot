import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminUser } from "@/lib/auth/admin";
import { requireApiUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  query: z.string().trim().min(1).max(100),
});

/** Bounded admin lookup; the service client bypasses RLS, so never drop the guard. */
export async function GET(request: Request) {
  try {
    const session = await requireApiUser();
    if (!isAdminUser(session.user)) {
      throw new AppError("forbidden", "Administrator access required");
    }

    const url = new URL(request.url);
    const { query } = querySchema.parse({ query: url.searchParams.get("query") ?? "" });
    const term = query.replace(/[%,()\\]/g, " ").trim();
    if (!term) return NextResponse.json({ users: [] });

    const pattern = `%${term}%`;
    const { data, error } = await getServiceClient()
      .from("users")
      .select("id, discord_id, username, global_name, plan, plan_source, is_admin")
      .or(`discord_id.ilike.${pattern},username.ilike.${pattern},global_name.ilike.${pattern}`)
      .order("username")
      .limit(20);
    if (error) throw new AppError("unknown", `User search failed: ${error.message}`);

    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

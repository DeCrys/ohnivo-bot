import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, setLocaleCookie } from "@/lib/auth/session";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.enum(["cs", "en"]),
  path: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await parseJson(request, (value) => bodySchema.parse(value));
    await setLocaleCookie(body.locale);

    const session = await getSession();
    if (session) {
      await getServiceClient()
        .from("users")
        .update({ locale: body.locale })
        .eq("id", session.user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

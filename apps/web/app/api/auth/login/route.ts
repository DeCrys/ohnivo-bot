import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomToken } from "@/lib/auth/crypto";
import { getSession, OAUTH_STATE_COOKIE } from "@/lib/auth/session";
import { discordLoginUrl } from "@/lib/discord";
import { env } from "@/lib/env";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const next = safeNext(url.searchParams.get("next"));
    const session = await getSession();
    if (session) return NextResponse.redirect(new URL(next, env.NEXT_PUBLIC_APP_URL));

    const state = randomToken(24);
    const value = encodeURIComponent(JSON.stringify({ state, next }));
    cookies().set(OAUTH_STATE_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return NextResponse.redirect(discordLoginUrl(state));
  } catch (error) {
    console.error("[auth] login start failed", error);
    return NextResponse.redirect(new URL("/login?error=config", env.NEXT_PUBLIC_APP_URL));
  }
}

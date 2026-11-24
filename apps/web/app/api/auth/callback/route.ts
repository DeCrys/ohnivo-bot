import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, OAUTH_STATE_COOKIE } from "@/lib/auth/session";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/request";
import { exchangeCode, fetchDiscordUser, syncUserGuilds } from "@/lib/discord";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getServiceClient } from "@/lib/supabase/service";
import type { UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface StatePayload {
  state: string;
  next: string;
}

function parseState(raw: string | undefined): StatePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StatePayload>;
    if (typeof parsed.state !== "string" || typeof parsed.next !== "string") return null;
    if (!parsed.next.startsWith("/") || parsed.next.startsWith("//")) return null;
    return { state: parsed.state, next: parsed.next };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = parseState(cookies().get(OAUTH_STATE_COOKIE)?.value);
  cookies().delete(OAUTH_STATE_COOKIE);

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, env.NEXT_PUBLIC_APP_URL));

  if (!code || !state || !stored || stored.state !== state) return fail("state");

  try {
    const tokens = await exchangeCode(code);
    const discordUser = await fetchDiscordUser(tokens.accessToken);
    const service = getServiceClient();

    const { data: existing, error: existingError } = await service
      .from("users")
      .select("id")
      .eq("discord_id", discordUser.id)
      .maybeSingle();
    if (existingError) throw new AppError("unknown", existingError.message);

    const { data: user, error: upsertError } = await service
      .from("users")
      .upsert(
        {
          discord_id: discordUser.id,
          username: discordUser.username,
          global_name: discordUser.global_name,
          avatar: discordUser.avatar,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "discord_id" },
      )
      .select("*")
      .single();
    if (upsertError || !user) {
      throw new AppError("unknown", upsertError?.message ?? "User upsert failed");
    }

    await syncUserGuilds((user as UserRow).id, tokens.accessToken);

    if (!existing) {
      const locale = resolveLocale(cookies().get(LOCALE_COOKIE)?.value);
      const title = locale === "en" ? "Welcome to Ohnivo" : "Vítej v Ohnivu";
      const body =
        locale === "en"
          ? "Connect the bot to a server and let Sparky build your first structure."
          : "Připoj bota k serveru a nech Jiskříka postavit první strukturu.";
      await service.from("notifications").insert({
        user_id: (user as UserRow).id,
        type: "welcome",
        title,
        body,
        href: "/dashboard",
      });
    }

    await createSession({
      userId: (user as UserRow).id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });

    return NextResponse.redirect(new URL(stored.next, env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error("[auth] callback failed", error);
    return fail("access");
  }
}

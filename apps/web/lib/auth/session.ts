import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppError } from "../errors";
import { env } from "../env";
import { getServiceClient } from "../supabase/service";
import type { SessionRow, UserRow } from "../types";
import { decryptToken, encryptToken, hashToken, randomToken } from "./crypto";
import { refreshDiscordToken } from "../discord";

export const SESSION_COOKIE = "ohnivo_session";
export const OAUTH_STATE_COOKIE = "ohnivo_oauth_state";
export const LOCALE_COOKIE = "ohnivo_locale";
export const SESSION_TTL_DAYS = 30;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export interface AppSession {
  sessionId: string;
  user: UserRow;
  discordAccessToken: string;
}

interface CreateSessionInput {
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  const service = getServiceClient();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await service.from("sessions").insert({
    user_id: input.userId,
    token_hash: hashToken(token),
    discord_access_token: encryptToken(input.accessToken),
    discord_refresh_token: input.refreshToken ? encryptToken(input.refreshToken) : null,
    discord_token_expires_at: new Date(Date.now() + input.expiresIn * 1000).toISOString(),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new AppError("unknown", `Could not create session: ${error.message}`);

  cookies().set(SESSION_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function getSession(): Promise<AppSession | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const service = getServiceClient();
  const { data, error } = await service
    .from("sessions")
    .select("*, users(*)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error) {
    console.error("[auth] session lookup failed", error.message);
    return null;
  }
  if (!data) return null;

  const session = data as SessionRow & { users: UserRow };
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await service.from("sessions").delete().eq("id", session.id);
    return null;
  }

  let accessToken = decryptToken(session.discord_access_token);
  let refreshToken = session.discord_refresh_token
    ? decryptToken(session.discord_refresh_token)
    : null;
  let tokenExpiresAt = session.discord_token_expires_at
    ? new Date(session.discord_token_expires_at).getTime()
    : 0;

  if (refreshToken && tokenExpiresAt < Date.now() + 5 * 60 * 1000) {
    try {
      const refreshed = await refreshDiscordToken(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;
      tokenExpiresAt = Date.now() + refreshed.expiresIn * 1000;
      await service
        .from("sessions")
        .update({
          discord_access_token: encryptToken(accessToken),
          discord_refresh_token: refreshToken ? encryptToken(refreshToken) : null,
          discord_token_expires_at: new Date(tokenExpiresAt).toISOString(),
        })
        .eq("id", session.id);
    } catch (error) {
      console.warn("[auth] Discord token refresh failed", error);
    }
  }

  if (Date.now() - new Date(session.last_seen_at).getTime() > 10 * 60 * 1000) {
    await service.from("sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id);
  }

  return {
    sessionId: session.id,
    user: session.users,
    discordAccessToken: accessToken,
  };
}

export async function requireUser(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireApiUser(): Promise<AppSession> {
  const session = await getSession();
  if (!session) throw new AppError("unauthorized", "No active session");
  return session;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await getServiceClient().from("sessions").delete().eq("token_hash", hashToken(token));
  }
  cookies().delete(SESSION_COOKIE);
}

export async function setLocaleCookie(locale: "cs" | "en"): Promise<void> {
  cookies().set(LOCALE_COOKIE, locale, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60,
  });
}

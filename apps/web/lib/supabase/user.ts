import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { env } from "../env";
import { getServiceClient } from "./service";

let warnedAboutFallback = false;

/**
 * Mints a short-lived Supabase-compatible JWT for the given user so that
 * Postgres RLS (`auth.uid()`) is enforced for user-scoped queries.
 *
 * Requires SUPABASE_JWT_SECRET (Supabase dashboard -> Settings -> API).
 * In local development without the secret we fall back to the service client;
 * production deployments must set it (documented in README).
 */
export async function mintUserJwt(userId: string): Promise<string | null> {
  if (!env.SUPABASE_JWT_SECRET) return null;
  const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
  return new SignJWT({ role: "authenticated", aud: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function getUserClient(userId: string): Promise<SupabaseClient> {
  const jwt = await mintUserJwt(userId);
  if (!jwt || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (!warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        "[supabase] SUPABASE_JWT_SECRET or anon key missing - using service client fallback. Set both in production.",
      );
    }
    return getServiceClient();
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function getPublicSupabaseConfig(): { url: string; anonKey: string } | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
}

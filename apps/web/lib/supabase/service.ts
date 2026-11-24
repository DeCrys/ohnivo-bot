import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "../env";

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Server only - never import this from a client
 * component. Bypasses RLS, so every caller must scope queries explicitly.
 */
export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}

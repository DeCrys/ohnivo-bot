import { createClient } from "@supabase/supabase-js";
import { botEnv } from "./env.js";

/**
 * Service-role client. The bot is a trusted worker: it only touches jobs it
 * has claimed and never serves user traffic directly.
 */
export const supabase = createClient(botEnv.supabaseUrl, botEnv.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

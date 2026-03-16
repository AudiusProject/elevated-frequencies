import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let _client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Server-side Supabase client with service role (bypasses RLS).
 * Use in API routes / Express server only. Never expose service role key to the client.
 */
export function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env file."
    );
  }
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

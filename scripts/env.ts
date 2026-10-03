import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

/** Service-role client for seed scripts. Reads .env.local; refuses to run without it. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first (see .env.example).");
    process.exit(1);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function must<T>(r: { data: T | null; error: { message: string } | null }, what: string): T {
  if (r.error) {
    console.error(`${what}: ${r.error.message}`);
    process.exit(1);
  }
  return r.data as T;
}

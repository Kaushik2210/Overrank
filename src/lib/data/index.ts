import "server-only";
import { memoryRepo } from "./memory";
import type { Repo } from "./repo";

export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** The data layer every server component and action goes through. */
export function getRepo(): Repo {
  return memoryRepo;
}

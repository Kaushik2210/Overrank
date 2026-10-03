import "server-only";
import { createServerSupabase } from "./server";
import type { Role, Session } from "@/lib/data/types";

export async function getSupabaseSession(): Promise<Session | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", data.user.id)
    .single();
  if (!profile) return null;
  return {
    userId: data.user.id,
    role: profile.role as Role,
    name: profile.name,
  };
}

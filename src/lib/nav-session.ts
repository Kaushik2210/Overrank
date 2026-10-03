import "server-only";
import { getSession } from "@/lib/auth";
import type { NavSession } from "@/components/nav/UserMenu";

export async function getNavSession(): Promise<NavSession> {
  const s = await getSession();
  if (!s) return null;
  return { name: s.name, role: s.role, color: "#6ee7f9" };
}

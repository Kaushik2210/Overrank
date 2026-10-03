import "server-only";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { NavSession } from "@/components/nav/UserMenu";

export async function getNavSession(): Promise<NavSession> {
  const s = await getSession();
  if (!s) return null;
  let color: string | undefined;
  let glow: string | undefined;
  if (s.teamId) {
    const team = (await getRepo().getTeams()).find((t) => t.id === s.teamId);
    color = team?.colorPrimary;
    glow = team?.colorGlow;
  }
  return { name: s.name, role: s.role, color: color ?? "#6ee7f9", glow };
}

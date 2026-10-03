"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, run, zodFail } from "./helpers";
import { getRepo } from "@/lib/data";
import { saveEvidence } from "@/lib/storage";
import { awardSchema, teamSchema, xpSettingsSchema } from "@/lib/validators";
import type { RosterRow } from "@/lib/data/types";

function refreshStandings() {
  for (const p of ["/leaderboard", "/admin", "/admin/points", "/admin/students", "/admin/analytics", "/teams", "/"]) revalidatePath(p);
}

export async function searchStudentsAction(q: string) {
  return run({ staff: true }, async () => {
    const rows = await getRepo().searchStudents(String(q).slice(0, 60), 8);
    return rows.map((s) => ({ id: s.id, name: s.name, teamName: s.teamName, teamColor: s.teamColor, teamId: s.teamId, points: s.points }));
  });
}

export async function awardPointsAction(fd: FormData) {
  let ids: unknown;
  try {
    ids = JSON.parse(String(fd.get("studentIds") ?? "[]"));
  } catch {
    return fail("Invalid student list");
  }
  const p = awardSchema.safeParse({
    studentIds: ids,
    amount: fd.get("amount"),
    categoryId: fd.get("categoryId"),
    reason: fd.get("reason"),
    eventId: fd.get("eventId") || null,
  });
  if (!p.success) return zodFail(p.error);
  const r = await run({ staff: true, limit: ["award", 60, 60_000] }, async (s) => {
    const f = fd.get("evidence");
    const evidenceUrl = f instanceof File && f.size > 0 ? await saveEvidence(f, s) : null;
    return getRepo().awardPoints(s, { ...p.data, evidenceUrl });
  });
  if (r.ok) refreshStandings();
  return r;
}

export async function reverseTransactionAction(id: string, note: string) {
  const r = await run({ staff: true }, (s) => getRepo().reverseTransaction(s, id, String(note).slice(0, 200)));
  if (r.ok) refreshStandings();
  return r;
}

export async function updateTeamAction(input: unknown) {
  const p = teamSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const { id, ...patch } = p.data;
  const r = await run({ staff: true }, (s) => getRepo().updateTeam(s, id, patch));
  if (r.ok) refreshStandings();
  return r;
}

export async function createCategoryAction(input: unknown) {
  const p = z.object({ name: z.string().trim().min(2, "Name is too short").max(40), icon: z.string().min(1), color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour") }).safeParse(input);
  if (!p.success) return zodFail(p.error);
  const r = await run({ staff: true }, (s) => getRepo().createCategory(s, p.data));
  revalidatePath("/admin/settings");
  return r;
}

export async function updateXpSettingsAction(input: unknown) {
  const p = xpSettingsSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const t = p.data.thresholds;
  if (t.some((n, i) => i > 0 && n <= t[i - 1])) return fail("Thresholds must increase", { thresholds: "Each level needs more XP than the last" });
  const r = await run({ staff: true }, (s) => getRepo().updateSettings(s, { xp: p.data }));
  refreshStandings();
  return r;
}

export async function saveAchievementAction(input: unknown) {
  const p = z
    .object({
      id: z.string().optional(),
      name: z.string().trim().min(2).max(40),
      description: z.string().trim().max(200),
      icon: z.string().min(1),
      rarity: z.enum(["common", "rare", "epic", "legendary"]),
      xp: z.coerce.number().int().min(0).max(2000),
      rule: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("manual") }),
        z.object({ kind: z.literal("points"), threshold: z.coerce.number().int().min(1) }),
        z.object({ kind: z.literal("category"), categoryId: z.string().min(1), threshold: z.coerce.number().int().min(1) }),
      ]),
    })
    .safeParse(input);
  if (!p.success) return zodFail(p.error);
  const r = await run({ staff: true }, (s) => getRepo().saveAchievement(s, p.data));
  revalidatePath("/achievements");
  revalidatePath("/admin/achievements");
  return r;
}

export async function grantAchievementAction(achievementId: string, studentId: string) {
  const r = await run({ staff: true }, (s) => getRepo().grantAchievement(s, achievementId, studentId));
  revalidatePath("/achievements");
  return r;
}

const rosterRows = z.array(z.object({ team: z.string(), studentId: z.string(), name: z.string() })).max(2000);

export async function previewRosterAction(rows: unknown) {
  const p = rosterRows.safeParse(rows);
  if (!p.success) return zodFail(p.error);
  return run({ staff: true }, (s) => (void s, getRepo().previewRoster(p.data as RosterRow[])));
}

export async function commitRosterAction(rows: unknown) {
  const p = rosterRows.safeParse(rows);
  if (!p.success) return zodFail(p.error);
  const r = await run({ staff: true }, (s) => getRepo().commitRoster(s, p.data as RosterRow[]));
  if (r.ok) refreshStandings();
  return r;
}

export async function teamMembersAction(teamId: string) {
  return run({ staff: true }, async () => {
    const all = await getRepo().getStudents();
    return all.filter((s) => s.teamId === teamId).map((s) => ({ id: s.id, name: s.name, teamName: s.teamName, teamColor: s.teamColor, teamId: s.teamId, points: s.points }));
  });
}

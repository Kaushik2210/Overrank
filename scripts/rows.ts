/**
 * Pure builders that turn the seed store into database rows. No I/O here, so tests can feed the
 * same rows to a real Postgres and compare the result with the in-memory logic.
 */
import { randomUUID } from "node:crypto";
import type { Store } from "../src/lib/data/seed";
import type { Achievement } from "../src/lib/data/types";

const teamSlug = (id: string) => id.replace(/^team_/, "");
const catSlug = (id: string) => id.replace(/^cat_/, "");

export type Row = Record<string, unknown>;

export function coreRows(store: Store) {
  return {
    teams: store.teams.map((t) => ({ name: t.name, slug: t.slug, color_primary: t.colorPrimary, color_glow: t.colorGlow, motto: t.motto })),
    categories: store.categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon, color: c.color })),
    students: store.students.map((s) => ({ student_id: s.id, name: s.name, team_slug: teamSlug(s.teamId) })),
    achievements: store.achievements.filter((a) => !a.isDemo),
    events: store.events.filter((e) => !e.isDemo),
  };
}

/** Rewrites a memory-store rule ({categoryId: "cat_sports"}) with the real category uuid. */
export function resolveRule(rule: Achievement["rule"], catIds: Map<string, string>) {
  return rule.kind === "category" ? { ...rule, categoryId: catIds.get(catSlug(rule.categoryId)) } : rule;
}

export type Maps = { teams: Map<string, string>; cats: Map<string, string>; achievements: Map<string, string> };

/** Everything a demo season needs, flagged is_demo, with fresh ids and all cross references resolved. */
export function demoRows(store: Store, m: Maps) {
  const team = (id: string) => m.teams.get(teamSlug(id))!;
  const cat = (id: string) => m.cats.get(catSlug(id))!;

  const eventIds = new Map(store.events.filter((e) => e.isDemo).map((e) => [e.id, randomUUID()]));
  const achIds = new Map<string, string>();
  const demoAch = store.achievements.filter((a) => a.isDemo);
  for (const a of demoAch) achIds.set(a.id, randomUUID());
  // core achievements already exist in the database; map them by memory id -> real id
  for (const a of store.achievements.filter((x) => !x.isDemo)) achIds.set(a.id, m.achievements.get(a.name)!);

  const txIds = new Map(store.transactions.filter((t) => t.isDemo).map((t) => [t.id, randomUUID()]));
  const demoTx = store.transactions.filter((t) => t.isDemo);
  const toTx = (t: (typeof demoTx)[number]) => ({
    id: txIds.get(t.id),
    student_id: t.studentId,
    team_id: team(t.teamId),
    amount: t.amount,
    category_id: cat(t.categoryId),
    reason: t.reason,
    event_id: t.eventId ? eventIds.get(t.eventId) : null,
    awarded_by_name: t.awardedBy,
    status: t.status,
    reverses_id: t.reversesId ? txIds.get(t.reversesId) : null,
    is_demo: true,
    created_at: t.createdAt,
  });

  return {
    events: [...eventIds].map(([memId, id]) => {
      const e = store.events.find((x) => x.id === memId)!;
      return {
        id,
        title: e.title,
        description: e.description,
        starts_at: e.startsAt,
        ends_at: e.endsAt,
        points: e.points,
        category_id: cat(e.categoryId),
        location: e.location,
        winner_team_id: e.winnerTeamId ? team(e.winnerTeamId) : null,
        registered_base: e.registeredCount,
        is_demo: true,
      };
    }),
    eventTeams: [...eventIds].flatMap(([memId, id]) => store.events.find((x) => x.id === memId)!.teamIds.map((t) => ({ event_id: id, team_id: team(t) }))),
    achievements: demoAch.map((a) => ({
      id: achIds.get(a.id),
      name: a.name,
      description: a.description,
      icon: a.icon,
      rarity: a.rarity,
      xp: a.xp,
      rule: resolveRule(a.rule, m.cats),
      is_demo: true,
    })),
    // originals first so compensating rows can reference them
    transactionsFirst: demoTx.filter((t) => !t.reversesId).map(toTx),
    transactionsSecond: demoTx.filter((t) => t.reversesId).map(toTx),
    studentAchievements: store.studentAchievements.map((x) => ({ achievement_id: achIds.get(x.achievementId), student_id: x.studentId, unlocked_at: x.unlockedAt, is_demo: true })),
    audit: store.audit.map((a) => ({ actor_id: null, actor_name: a.actorName, action: a.action, target: a.target, detail: a.detail, is_demo: true, created_at: a.createdAt })),
  };
}

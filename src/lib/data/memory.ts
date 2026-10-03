import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { rankBy } from "@/lib/standings";
import { levelFromPoints } from "@/lib/xp";
import { slugify } from "@/lib/utils";
import { buildStore, type Store } from "./seed";
import type { Repo } from "./repo";
import type {
  Achievement,
  Analytics,
  AuditLog,
  AwardInput,
  AwardResult,
  EventItem,
  EventStatus,
  PointTransaction,
  RosterPreview,
  RosterRow,
  Session,
  StudentDetail,
  StudentStanding,
  Team,
  TeamDetail,
  TeamStanding,
  TxQuery,
  UnlockedAchievement,
} from "./types";

type Globals = { __hc?: Store };
const g = globalThis as unknown as Globals;

/** Lets another repo run the read logic below against a snapshot it loaded from elsewhere (see supabase.ts). */
const snapshot = new AsyncLocalStorage<Store>();
export const withSnapshot = <T>(store: Store, fn: () => Promise<T>) => snapshot.run(store, fn);

function S(): Store {
  return snapshot.getStore() ?? (g.__hc ??= buildStore({ demo: process.env.HOUSECORE_DEMO !== "0" }));
}

const DAY = 86400000;
const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------- derived data */

function counted(s: Store, asOf?: number) {
  return s.transactions.filter((t) => t.status !== "pending" && (asOf === undefined || +new Date(t.createdAt) <= asOf));
}

function teamStandings(s: Store): TeamStanding[] {
  const now = Date.now();
  const sums = (asOf?: number) => {
    const m = new Map<string, number>();
    for (const t of counted(s, asOf)) m.set(t.teamId, (m.get(t.teamId) ?? 0) + t.amount);
    return m;
  };
  const cur = sums();
  const prev = sums(now - 7 * DAY);
  const rankNow = new Map(rankBy(s.teams, (t) => cur.get(t.id) ?? 0).map((t) => [t.id, t.rank]));
  const rankPrev = new Map(rankBy(s.teams, (t) => prev.get(t.id) ?? 0).map((t) => [t.id, t.rank]));
  return s.teams
    .map((t) => {
      const memberIds = new Set(s.students.filter((x) => x.teamId === t.id).map((x) => x.id));
      return {
        ...t,
        points: cur.get(t.id) ?? 0,
        rank: rankNow.get(t.id)!,
        previousRank: rankPrev.get(t.id)!,
        weeklyGrowth: (cur.get(t.id) ?? 0) - (prev.get(t.id) ?? 0),
        memberCount: memberIds.size,
        achievementCount: s.studentAchievements.filter((a) => memberIds.has(a.studentId)).length,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}

function studentStandings(s: Store): StudentStanding[] {
  const pts = new Map<string, number>();
  for (const t of counted(s)) pts.set(t.studentId, (pts.get(t.studentId) ?? 0) + t.amount);
  const teamPts = new Map<string, number>();
  for (const st of s.students) teamPts.set(st.teamId, (teamPts.get(st.teamId) ?? 0) + (pts.get(st.id) ?? 0));
  const teams = new Map(s.teams.map((t) => [t.id, t]));
  const overall = new Map(rankBy(s.students, (x) => pts.get(x.id) ?? 0).map((x) => [x.id, x.rank]));
  const inTeam = new Map<string, number>();
  for (const t of s.teams) {
    rankBy(
      s.students.filter((x) => x.teamId === t.id),
      (x) => pts.get(x.id) ?? 0,
    ).forEach((x) => inTeam.set(x.id, x.rank));
  }
  return s.students.map((st) => {
    const p = pts.get(st.id) ?? 0;
    const lv = levelFromPoints(p, s.settings.xp);
    const team = teams.get(st.teamId)!;
    const tp = teamPts.get(st.teamId) ?? 0;
    return {
      ...st,
      points: p,
      xp: lv.xp,
      level: lv.level,
      levelProgress: lv.levelProgress,
      xpToNext: lv.xpToNext,
      rank: overall.get(st.id)!,
      teamRank: inTeam.get(st.id)!,
      teamContribution: tp > 0 ? Math.max(0, Math.min(1, p / tp)) : 0,
      teamSlug: team.slug,
      teamName: team.name,
      teamColor: team.colorPrimary,
      teamGlow: team.colorGlow,
    };
  });
}

function eventStatus(e: EventItem, now = Date.now()): EventStatus {
  if (now < +new Date(e.startsAt)) return "upcoming";
  if (now <= +new Date(e.endsAt)) return "live";
  return "past";
}

function withEventState(_s: Store, e: EventItem): EventItem {
  return { ...e, status: eventStatus(e) };
}

function audit(s: Store, actor: Session, action: string, target: string, detail: string) {
  s.audit.unshift({ id: randomUUID(), actorId: actor.userId, actorName: actor.name, action, target, detail, createdAt: nowIso() });
  if (s.audit.length > 1000) s.audit.length = 1000;
}

function mustBeStaff(actor: Session) {
  if (actor.role !== "admin" && actor.role !== "teacher") throw new Error("Not allowed");
}

/** Unlock any threshold achievements the student now qualifies for. */
function checkAchievements(s: Store, studentId: string): UnlockedAchievement[] {
  const student = s.students.find((x) => x.id === studentId);
  if (!student) return [];
  const mine = counted(s).filter((t) => t.studentId === studentId);
  const total = mine.reduce((n, t) => n + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of mine) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
  const have = new Set(s.studentAchievements.filter((a) => a.studentId === studentId).map((a) => a.achievementId));
  const out: UnlockedAchievement[] = [];
  for (const a of s.achievements) {
    if (have.has(a.id) || a.rule.kind === "manual") continue;
    const ok = a.rule.kind === "points" ? total >= a.rule.threshold : (byCat.get(a.rule.categoryId) ?? 0) >= a.rule.threshold;
    if (!ok) continue;
    s.studentAchievements.push({ achievementId: a.id, studentId, unlockedAt: nowIso() });
    out.push({ studentId, studentName: student.name, achievement: a });
  }
  return out;
}

function newTx(s: Store, p: Omit<PointTransaction, "id" | "createdAt" | "teamId" | "teamName" | "teamColor" | "studentName" | "categoryName" | "eventTitle" | "type" | "isDemo" | "reversesId"> & { reversesId?: string | null }): PointTransaction {
  const st = s.students.find((x) => x.id === p.studentId);
  if (!st) throw new Error(`Unknown student ${p.studentId}`);
  const team = s.teams.find((t) => t.id === st.teamId)!;
  const cat = s.categories.find((c) => c.id === p.categoryId);
  if (!cat) throw new Error("Unknown category");
  const ev = p.eventId ? s.events.find((e) => e.id === p.eventId) : null;
  const tx: PointTransaction = {
    ...p,
    id: randomUUID(),
    createdAt: nowIso(),
    studentName: st.name,
    teamId: team.id,
    teamName: team.name,
    teamColor: team.colorPrimary,
    categoryName: cat.name,
    eventTitle: ev?.title ?? null,
    type: p.amount < 0 ? "deduction" : "award",
    reversesId: p.reversesId ?? null,
    isDemo: false,
  };
  s.transactions.push(tx);
  return tx;
}

/* ------------------------------------------------------------------- repo */

export const memoryRepo: Repo = {
  mode: "preview",

  async getSettings() {
    return structuredClone(S().settings);
  },
  async updateSettings(actor, patch) {
    mustBeStaff(actor);
    const s = S();
    s.settings = { ...s.settings, ...patch, xp: { ...s.settings.xp, ...(patch.xp ?? {}) } };
    audit(s, actor, "settings.update", "settings", JSON.stringify(patch));
    return structuredClone(s.settings);
  },

  async getTeams() {
    return teamStandings(S());
  },

  async getTeam(slug): Promise<TeamDetail | null> {
    const s = S();
    const team = teamStandings(s).find((t) => t.slug === slug);
    if (!team) return null;
    const students = studentStandings(s);
    const members = students.filter((m) => m.teamId === team.id).sort((a, b) => a.teamRank - b.teamRank || a.name.localeCompare(b.name));
    const memberIds = new Set(members.map((m) => m.id));
    const txs = counted(s).filter((t) => t.teamId === team.id);

    const achCount = new Map<string, number>();
    for (const sa of s.studentAchievements) if (memberIds.has(sa.studentId)) achCount.set(sa.achievementId, (achCount.get(sa.achievementId) ?? 0) + 1);
    const achievements = [...achCount.entries()]
      .map(([id, count]) => ({ achievement: s.achievements.find((a) => a.id === id)!, count }))
      .filter((x) => x.achievement)
      .sort((a, b) => b.count - a.count);

    const eventsWon = s.events.filter((e) => e.winnerTeamId === team.id).map((e) => withEventState(s, e));

    const cat = new Map<string, number>();
    for (const t of txs) cat.set(t.categoryId, (cat.get(t.categoryId) ?? 0) + t.amount);
    const categoryPerformance = s.categories
      .map((c) => ({ categoryId: c.id, name: c.name, color: c.color, points: cat.get(c.id) ?? 0 }))
      .filter((c) => c.points !== 0)
      .sort((a, b) => b.points - a.points);

    const now = Date.now();
    let running = 0;
    const weekly = Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      const p = txs.filter((t) => +new Date(t.createdAt) > start && +new Date(t.createdAt) <= end).reduce((n, t) => n + t.amount, 0);
      return { week: `W${i + 1}`, points: p, end };
    }).map((w) => {
      running += w.points;
      return { week: w.week, points: w.points, total: running };
    });

    const timeline: TeamDetail["timeline"] = [
      ...eventsWon.map((e) => ({ at: e.endsAt, kind: "event" as const, title: `Won ${e.title}`, detail: `${e.categoryName} · ${e.points} pts` })),
      ...txs
        .filter((t) => t.amount >= 50)
        .map((t) => ({ at: t.createdAt, kind: "award" as const, title: `${t.studentName} +${t.amount}`, detail: `${t.categoryName}: ${t.reason}` })),
      ...s.studentAchievements
        .filter((a) => memberIds.has(a.studentId))
        .map((a) => {
          const ach = s.achievements.find((x) => x.id === a.achievementId)!;
          const who = members.find((m) => m.id === a.studentId)!;
          return { at: a.unlockedAt, kind: "achievement" as const, title: `${who.name} unlocked ${ach.name}`, detail: ach.description };
        }),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 14);

    return {
      team,
      members,
      topContributors: members.filter((m) => m.points > 0).slice(0, 5),
      achievements,
      eventsWon,
      history: [...txs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20),
      categoryPerformance,
      weekly: weekly.map(({ week, points, total }) => ({ week, points, total })),
      timeline,
    };
  },

  async updateTeam(actor, id, patch) {
    mustBeStaff(actor);
    const s = S();
    const t = s.teams.find((x) => x.id === id);
    if (!t) throw new Error("Team not found");
    Object.assign(t, patch);
    for (const tx of s.transactions) if (tx.teamId === id) {
      tx.teamName = t.name;
      tx.teamColor = t.colorPrimary;
    }
    audit(s, actor, "team.update", t.name, JSON.stringify(patch));
  },

  async getStudents() {
    return studentStandings(S());
  },

  async getStudent(id): Promise<StudentDetail | null> {
    const s = S();
    const student = studentStandings(s).find((x) => x.id === id);
    if (!student) return null;
    const unlocked = new Map(s.studentAchievements.filter((a) => a.studentId === id).map((a) => [a.achievementId, a.unlockedAt]));
    const txs = counted(s).filter((t) => t.studentId === id);
    const cat = new Map<string, number>();
    for (const t of txs) cat.set(t.categoryId, (cat.get(t.categoryId) ?? 0) + t.amount);
    return {
      student,
      achievements: s.achievements.map((a) => ({ ...a, unlockedAt: unlocked.get(a.id) ?? null })),
      transactions: s.transactions.filter((t) => t.studentId === id && t.status !== "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      categoryBreakdown: s.categories
        .map((c) => ({ categoryId: c.id, name: c.name, color: c.color, points: cat.get(c.id) ?? 0 }))
        .filter((c) => c.points !== 0)
        .sort((a, b) => b.points - a.points),
    };
  },

  async searchStudents(q, limit = 8) {
    const needle = q.trim().toLowerCase();
    const all = studentStandings(S());
    if (!needle) return all.slice(0, limit);
    return all.filter((x) => x.name.toLowerCase().includes(needle) || x.id.includes(needle) || x.teamName.toLowerCase().includes(needle)).slice(0, limit);
  },

  async getCategories() {
    return structuredClone(S().categories);
  },
  async createCategory(actor, input) {
    mustBeStaff(actor);
    const s = S();
    const slug = slugify(input.name);
    if (s.categories.some((c) => c.slug === slug)) throw new Error("A category with that name already exists");
    const cat = { id: `cat_${slug}`, slug, ...input };
    s.categories.push(cat);
    audit(s, actor, "category.create", cat.name, "");
    return cat;
  },

  async listTransactions(q: TxQuery) {
    const s = S();
    let rows = s.transactions.filter((t) => t.status !== "pending" || true);
    if (q.teamId) rows = rows.filter((t) => t.teamId === q.teamId);
    if (q.categoryId) rows = rows.filter((t) => t.categoryId === q.categoryId);
    if (q.studentId) rows = rows.filter((t) => t.studentId === q.studentId);
    if (q.status) rows = rows.filter((t) => t.status === q.status);
    if (q.q) {
      const n = q.q.toLowerCase();
      rows = rows.filter((t) => `${t.studentName} ${t.studentId} ${t.reason} ${t.categoryName} ${t.teamName}`.toLowerCase().includes(n));
    }
    const sorters: Record<NonNullable<TxQuery["sort"]>, (a: PointTransaction, b: PointTransaction) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      amount_desc: (a, b) => b.amount - a.amount,
      amount_asc: (a, b) => a.amount - b.amount,
    };
    rows = [...rows].sort(sorters[q.sort ?? "newest"]);
    const total = rows.length;
    const size = Math.min(Math.max(q.pageSize ?? 15, 1), 500);
    const page = Math.max(q.page ?? 1, 1);
    return { rows: rows.slice((page - 1) * size, page * size), total };
  },

  async getTransaction(id) {
    return S().transactions.find((t) => t.id === id) ?? null;
  },

  async awardPoints(actor, input: AwardInput): Promise<AwardResult> {
    mustBeStaff(actor);
    const s = S();
    if (!input.amount) throw new Error("Amount can't be zero");
    const ids = [...new Set(input.studentIds)];
    if (!ids.length) throw new Error("Pick at least one student");
    const first = s.students.find((x) => x.id === ids[0]);
    if (!first) throw new Error("Unknown student");
    const before = teamStandings(s);
    const bTeam = before.find((t) => t.id === first.teamId)!;
    const bLeader = before[0].id;

    const transactions: PointTransaction[] = [];
    const unlocked: UnlockedAchievement[] = [];
    for (const id of ids) {
      const tx = newTx(s, {
        studentId: id,
        amount: input.amount,
        categoryId: input.categoryId,
        reason: input.reason,
        eventId: input.eventId ?? null,
        awardedBy: actor.name,
        status: "active",
        evidenceUrl: input.evidenceUrl ?? null,
      });
      transactions.push(tx);
      unlocked.push(...checkAchievements(s, id));
      audit(s, actor, input.amount > 0 ? "points.award" : "points.deduct", tx.studentName, `${input.amount > 0 ? "+" : ""}${input.amount} in ${tx.categoryName}: ${input.reason}`);
    }

    const after = teamStandings(s);
    const aTeam = after.find((t) => t.id === first.teamId)!;
    const leaderChanged = after[0].id !== bLeader;
    return {
      transactions,
      teamBefore: { rank: bTeam.rank, points: bTeam.points },
      teamAfter: { rank: aTeam.rank, points: aTeam.points, name: aTeam.name },
      leaderChanged,
      unlocked,
    };
  },

  async reverseTransaction(actor, id, note) {
    mustBeStaff(actor);
    const s = S();
    const tx = s.transactions.find((t) => t.id === id);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "active" || tx.reversesId) throw new Error("This transaction can't be reversed");
    tx.status = "reversed";
    newTx(s, {
      studentId: tx.studentId,
      amount: -tx.amount,
      categoryId: tx.categoryId,
      reason: `Reversal: ${note || tx.reason}`,
      eventId: tx.eventId,
      awardedBy: actor.name,
      status: "active",
      evidenceUrl: null,
      reversesId: tx.id,
    });
    audit(s, actor, "points.reverse", tx.studentName, `${tx.amount} reversed. ${note}`);
  },

  async listEvents() {
    const s = S();
    const order: Record<EventStatus, number> = { live: 0, upcoming: 1, past: 2 };
    return s.events
      .map((e) => withEventState(s, e))
      .sort((a, b) => order[a.status] - order[b.status] || (a.status === "past" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt)));
  },
  async getEvent(id) {
    const s = S();
    const e = s.events.find((x) => x.id === id);
    return e ? withEventState(s, e) : null;
  },
  async saveEvent(actor, input) {
    mustBeStaff(actor);
    const s = S();
    const cat = s.categories.find((c) => c.id === input.categoryId) ?? s.categories[0];
    if (input.id) {
      const e = s.events.find((x) => x.id === input.id);
      if (!e) throw new Error("Event not found");
      Object.assign(e, input, { categoryId: cat.id, categoryName: cat.name });
      audit(s, actor, "event.update", e.title, "");
      return withEventState(s, e);
    }
    const startsAt = input.startsAt ?? new Date(Date.now() + 7 * DAY).toISOString();
    const e: EventItem = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? "",
      startsAt,
      endsAt: input.endsAt ?? new Date(+new Date(startsAt) + 3 * 3600000).toISOString(),
      points: input.points ?? 0,
      categoryId: cat.id,
      categoryName: cat.name,
      status: "upcoming",
      location: input.location ?? "TBA",
      teamIds: [],
      winnerTeamId: null,
      registeredCount: 0,
      isDemo: false,
    };
    s.events.push(e);
    audit(s, actor, "event.create", e.title, "");
    return withEventState(s, e);
  },
  async deleteEvent(actor, id) {
    mustBeStaff(actor);
    const s = S();
    const e = s.events.find((x) => x.id === id);
    if (!e) return;
    s.events = s.events.filter((x) => x.id !== id);
    audit(s, actor, "event.delete", e.title, "");
  },
  async setEventWinner(actor, eventId, teamId, award) {
    mustBeStaff(actor);
    const s = S();
    const e = s.events.find((x) => x.id === eventId);
    const t = s.teams.find((x) => x.id === teamId);
    if (!e || !t) throw new Error("Event or team not found");
    e.winnerTeamId = teamId;
    audit(s, actor, "event.winner", e.title, `${t.name}${award ? " (points awarded)" : ""}`);
    if (award && e.points) {
      await memoryRepo.awardPoints(actor, {
        studentIds: s.students.filter((x) => x.teamId === teamId).map((x) => x.id),
        amount: e.points,
        categoryId: e.categoryId,
        reason: `Won ${e.title}`,
        eventId: e.id,
      });
    }
  },

  async listAchievements(studentId) {
    const s = S();
    const counts = new Map<string, number>();
    for (const a of s.studentAchievements) counts.set(a.achievementId, (counts.get(a.achievementId) ?? 0) + 1);
    const mine = new Map(s.studentAchievements.filter((a) => a.studentId === studentId).map((a) => [a.achievementId, a.unlockedAt]));
    return s.achievements.map((a) => ({ ...a, unlockedAt: mine.get(a.id) ?? null, unlockedBy: counts.get(a.id) ?? 0 }));
  },
  async saveAchievement(actor, input) {
    mustBeStaff(actor);
    const s = S();
    const existing = input.id ? s.achievements.find((a) => a.id === input.id) : null;
    if (existing) {
      Object.assign(existing, input);
      audit(s, actor, "achievement.update", existing.name, "");
      return existing;
    }
    const a: Achievement = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? "",
      icon: input.icon ?? "Award",
      rarity: input.rarity ?? "common",
      xp: input.xp ?? 50,
      rule: input.rule ?? { kind: "manual" },
      isDemo: false,
    };
    s.achievements.push(a);
    audit(s, actor, "achievement.create", a.name, "");
    return a;
  },
  async grantAchievement(actor, achievementId, studentId) {
    mustBeStaff(actor);
    const s = S();
    const a = s.achievements.find((x) => x.id === achievementId);
    const st = s.students.find((x) => x.id === studentId);
    if (!a || !st) throw new Error("Not found");
    if (s.studentAchievements.some((x) => x.achievementId === achievementId && x.studentId === studentId)) return;
    s.studentAchievements.push({ achievementId, studentId, unlockedAt: nowIso() });
    audit(s, actor, "achievement.grant", st.name, a.name);
  },

  async listAudit(limit = 40): Promise<AuditLog[]> {
    return S().audit.slice(0, limit);
  },

  async getAnalytics(): Promise<Analytics> {
    const s = S();
    const teams = teamStandings(s);
    const now = Date.now();
    const rows = counted(s);
    const pointsOverTime = Array.from({ length: 9 }, (_, i) => {
      const end = now - (8 - i) * 7 * DAY;
      const row: Analytics["pointsOverTime"][number] = { date: new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
      for (const t of s.teams) row[t.slug] = rows.filter((x) => x.teamId === t.id && +new Date(x.createdAt) <= end).reduce((n, x) => n + x.amount, 0);
      return row;
    });
    const catPoints = new Map<string, number>();
    for (const t of rows) catPoints.set(t.categoryId, (catPoints.get(t.categoryId) ?? 0) + Math.max(0, t.amount));
    const students = studentStandings(s);
    const active = new Map<string, Set<string>>();
    for (const t of rows) (active.get(t.teamId) ?? active.set(t.teamId, new Set()).get(t.teamId)!).add(t.studentId);
    return {
      pointsOverTime,
      teamPerformance: teams.map((t) => ({ slug: t.slug, name: t.name, color: t.colorPrimary, points: t.points })),
      categoryDistribution: s.categories
        .map((c) => ({ name: c.name, color: c.color, points: catPoints.get(c.id) ?? 0 }))
        .filter((c) => c.points > 0)
        .sort((a, b) => b.points - a.points),
      topContributors: [...students].sort((a, b) => b.points - a.points).slice(0, 8),
      participation: teams.map((t) => ({ slug: t.slug, name: t.name, color: t.colorPrimary, active: active.get(t.id)?.size ?? 0, total: t.memberCount })),
      heatmap: teams.map((t) => ({
        team: t.name,
        color: t.colorPrimary,
        cells: s.categories.map((c) => ({
          category: c.name,
          points: rows.filter((x) => x.teamId === t.id && x.categoryId === c.id).reduce((n, x) => n + x.amount, 0),
        })),
      })),
    };
  },

  async previewRoster(rows: RosterRow[]): Promise<RosterPreview> {
    const s = S();
    const teamNames = new Map(s.teams.map((t) => [t.name.toLowerCase(), t]));
    const known = new Set(s.students.map((x) => x.id));
    const seen = new Set<string>();
    const issues: RosterPreview["issues"] = [];
    const valid: RosterRow[] = [];
    let adds = 0;
    let updates = 0;
    rows.forEach((r, i) => {
      const row = i + 2; // header is row 1
      const id = r.studentId.trim();
      if (!r.team.trim() || !id || !r.name.trim()) return void issues.push({ row, message: "Missing team, studentId or name" });
      if (!/^\d{5,12}$/.test(id)) return void issues.push({ row, message: `Student ID "${id}" must be 5 to 12 digits` });
      if (!teamNames.has(r.team.trim().toLowerCase())) return void issues.push({ row, message: `Unknown team "${r.team}"` });
      if (seen.has(id)) return void issues.push({ row, message: `Duplicate student ID ${id} in this file` });
      seen.add(id);
      valid.push({ team: teamNames.get(r.team.trim().toLowerCase())!.name, studentId: id, name: r.name.trim() });
      if (known.has(id)) updates++;
      else adds++;
    });
    return { valid, issues, adds, updates };
  },
  async commitRoster(actor, rows) {
    mustBeStaff(actor);
    const s = S();
    const preview = await memoryRepo.previewRoster(rows);
    if (preview.issues.length) throw new Error("Fix the highlighted rows first");
    const byName = new Map(s.teams.map((t) => [t.name.toLowerCase(), t] as [string, Team]));
    for (const r of preview.valid) {
      const team = byName.get(r.team.toLowerCase())!;
      const existing = s.students.find((x) => x.id === r.studentId);
      if (existing) Object.assign(existing, { name: r.name, teamId: team.id });
      else s.students.push({ id: r.studentId, name: r.name, teamId: team.id });
    }
    audit(s, actor, "roster.import", "roster", `${preview.adds} added, ${preview.updates} updated`);
    return { added: preview.adds, updated: preview.updates };
  },

  async getOverview() {
    const s = S();
    return {
      students: s.students.length,
      teams: s.teams.length,
      pointsAwarded: counted(s).filter((t) => t.amount > 0 && !t.reversesId).reduce((n, t) => n + t.amount, 0),
      activeEvents: s.events.filter((e) => eventStatus(e) !== "past").length,
    };
  },

  async findStudent(id) {
    return S().students.find((x) => x.id === id) ?? null;
  },
};

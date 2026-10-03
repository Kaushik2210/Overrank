import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { provisionStudent } from "@/lib/supabase/accounts";
import { DEFAULT_XP } from "@/lib/xp";
import { memoryRepo, withSnapshot } from "./memory";
import type { Store } from "./seed";
import type { Repo } from "./repo";
import type {
  Achievement,
  AwardResult,
  Dispute,
  Notification,
  PointTransaction,
  Session,
  Suggestion,
  UnlockedAchievement,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const db = (): SupabaseClient => createAdminSupabase();

function staff(actor: Session) {
  if (actor.role === "student") throw new Error("Not allowed");
}

/** Database errors are logged server-side; users only see a short, safe message. */
function fail(error: { message: string }, fallback = "Something went wrong. Please try again."): never {
  const known = ["Not allowed", "Unknown student", "Unknown category", "Amount must be", "Pick at least one student", "can't be reversed", "Transaction not found"];
  console.error("[supabase]", error.message);
  throw new Error(known.some((k) => error.message.includes(k)) ? error.message : fallback);
}

async function all(table: string, select = "*", order?: { col: string; asc?: boolean }): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db().from(table).select(select).range(from, from + 999);
    if (order) q = q.order(order.col, { ascending: order.asc ?? true });
    const { data, error } = await q;
    if (error) fail(error);
    out.push(...(data as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/* --------------------------------------------------------------- snapshot */

async function loadSnapshot(): Promise<Store> {
  const [teams, students, cats, txs, events, eventTeams, regs, ach, sa, sug, dis, audit, settings] = await Promise.all([
    all("teams"),
    all("students", "student_id,name,team_id"),
    all("point_categories"),
    all("point_transactions", "*", { col: "created_at" }),
    all("events"),
    all("event_teams"),
    all("event_registrations", "event_id,student_id"),
    all("achievements"),
    all("student_achievements"),
    all("suggestions", "*", { col: "created_at", asc: false }),
    all("disputes", "*", { col: "created_at", asc: false }),
    db().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300).then((r) => r.data ?? []),
    all("settings"),
  ]);

  const team = new Map(teams.map((t) => [t.id, t]));
  const student = new Map(students.map((s) => [s.student_id, s]));
  const cat = new Map(cats.map((c) => [c.id, c]));
  const evt = new Map(events.map((e) => [e.id, e]));
  const setting = (k: string) => settings.find((s) => s.key === k)?.value;

  const transactions: PointTransaction[] = txs.map((t) => ({
    id: t.id,
    studentId: t.student_id,
    studentName: student.get(t.student_id)?.name ?? t.student_id,
    teamId: t.team_id,
    teamName: team.get(t.team_id)?.name ?? "",
    teamColor: team.get(t.team_id)?.color_primary ?? "#888888",
    amount: t.amount,
    type: t.type,
    categoryId: t.category_id,
    categoryName: cat.get(t.category_id)?.name ?? "",
    reason: t.reason,
    eventId: t.event_id,
    eventTitle: t.event_id ? (evt.get(t.event_id)?.title ?? null) : null,
    awardedBy: t.awarded_by_name,
    createdAt: t.created_at,
    status: t.status,
    evidenceUrl: t.evidence_path,
    reversesId: t.reverses_id,
    isDemo: t.is_demo,
  }));

  const suggestions: Suggestion[] = sug.map((x) => ({
    id: x.id,
    studentId: x.student_id,
    studentName: student.get(x.student_id)?.name ?? x.student_id,
    teamId: student.get(x.student_id)?.team_id ?? "",
    activity: x.activity,
    description: x.description,
    categoryId: x.category_id,
    categoryName: cat.get(x.category_id)?.name ?? "",
    suggestedPoints: x.suggested_points,
    evidenceUrl: x.evidence_path,
    status: x.status,
    reviewNote: x.review_note,
    awardedPoints: x.awarded_points,
    createdAt: x.created_at,
    isDemo: x.is_demo,
  }));

  const disputes: Dispute[] = dis.map((x) => ({
    id: x.id,
    transactionId: x.transaction_id,
    studentId: x.student_id,
    studentName: student.get(x.student_id)?.name ?? x.student_id,
    reason: x.reason,
    evidenceUrl: x.evidence_path,
    status: x.status,
    resolution: x.resolution,
    reviewNote: x.review_note,
    createdAt: x.created_at,
    transaction: null,
    isDemo: x.is_demo,
  }));

  return {
    teams: teams.map((t) => ({ id: t.id, name: t.name, slug: t.slug, colorPrimary: t.color_primary, colorGlow: t.color_glow, motto: t.motto })),
    students: students.map((s) => ({ id: s.student_id, name: s.name, teamId: s.team_id })),
    categories: cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color })),
    transactions,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      points: e.points,
      categoryId: e.category_id,
      categoryName: cat.get(e.category_id)?.name ?? "",
      status: "upcoming" as const, // recomputed from the dates on read
      location: e.location,
      teamIds: eventTeams.filter((x) => x.event_id === e.id).map((x) => x.team_id),
      winnerTeamId: e.winner_team_id,
      registeredCount: e.registered_base,
      isDemo: e.is_demo,
    })),
    registrations: regs.map((r) => ({ eventId: r.event_id, studentId: r.student_id })),
    achievements: ach.map((a) => ({ id: a.id, name: a.name, description: a.description, icon: a.icon, rarity: a.rarity, xp: a.xp, rule: a.rule, isDemo: a.is_demo })),
    studentAchievements: sa.map((x) => ({ achievementId: x.achievement_id, studentId: x.student_id, unlockedAt: x.unlocked_at })),
    suggestions,
    disputes,
    notifications: [],
    audit: (audit as Row[]).map((a) => ({ id: a.id, actorId: a.actor_id ?? "", actorName: a.actor_name, action: a.action, target: a.target, detail: a.detail, createdAt: a.created_at })),
    settings: {
      xp: { ...DEFAULT_XP, ...(setting("xp") ?? {}) },
      siteName: setting("site")?.siteName ?? "HOUSECORE",
      tagline: setting("site")?.tagline ?? "EVERY POINT COUNTS.",
    },
    demoLoaded: false,
  };
}

/** One snapshot per request, so a page that calls several repo methods hits the database once. */
const requestSnapshot = cache(loadSnapshot);

const read = async <T>(fn: () => Promise<T>) => withSnapshot(await requestSnapshot(), fn);
const readFresh = async <T>(fn: () => Promise<T>) => withSnapshot(await loadSnapshot(), fn);

async function audit(actor: Session, action: string, target: string, detail: string) {
  const { error } = await db().rpc("write_audit", { p_actor: actor.userId, p_actor_name: actor.name, p_action: action, p_target: target, p_detail: detail });
  if (error) console.error("[audit]", error.message);
}

async function broadcast(title: string, body: string, kind: Notification["kind"]) {
  await db().from("notifications").insert({ user_id: null, title, body, kind });
}

async function notifyStudent(studentId: string, title: string, body: string, kind: Notification["kind"]) {
  const { data } = await db().from("students").select("user_id").eq("student_id", studentId).single();
  if (data?.user_id) await db().from("notifications").insert({ user_id: data.user_id, title, body, kind });
}

/* ------------------------------------------------------------------- repo */

export const supabaseRepo: Repo = {
  mode: "supabase",

  getSettings: () => read(() => memoryRepo.getSettings()),
  async updateSettings(actor, patch) {
    staff(actor);
    if (patch.xp) {
      const { error } = await db().from("settings").upsert({ key: "xp", value: patch.xp });
      if (error) fail(error);
    }
    if (patch.siteName || patch.tagline) {
      const cur = (await readFresh(() => memoryRepo.getSettings()));
      await db().from("settings").upsert({ key: "site", value: { siteName: patch.siteName ?? cur.siteName, tagline: patch.tagline ?? cur.tagline } });
    }
    await audit(actor, "settings.update", "settings", JSON.stringify(patch));
    return readFresh(() => memoryRepo.getSettings());
  },

  getTeams: () => read(() => memoryRepo.getTeams()),
  getTeam: (slug) => read(() => memoryRepo.getTeam(slug)),
  async updateTeam(actor, id, patch) {
    staff(actor);
    const { error } = await db()
      .from("teams")
      .update({ ...(patch.name && { name: patch.name }), ...(patch.motto !== undefined && { motto: patch.motto }), ...(patch.colorPrimary && { color_primary: patch.colorPrimary }), ...(patch.colorGlow && { color_glow: patch.colorGlow }) })
      .eq("id", id);
    if (error) fail(error, "Could not update the team. The name may already be taken.");
    await audit(actor, "team.update", patch.name ?? id, JSON.stringify(patch));
  },

  getStudents: () => read(() => memoryRepo.getStudents()),
  getStudent: (id) => read(() => memoryRepo.getStudent(id)),
  searchStudents: (q, limit) => read(() => memoryRepo.searchStudents(q, limit)),
  findStudent: (id) => read(() => memoryRepo.findStudent(id)),

  getCategories: () => read(() => memoryRepo.getCategories()),
  async createCategory(actor, input) {
    staff(actor);
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await db().from("point_categories").insert({ name: input.name, slug, icon: input.icon, color: input.color }).select().single();
    if (error) fail(error, "A category with that name already exists");
    await audit(actor, "category.create", input.name, "");
    return { id: data.id, name: data.name, slug: data.slug, icon: data.icon, color: data.color };
  },

  listTransactions: (q) => read(() => memoryRepo.listTransactions(q)),
  getTransaction: (id) => read(() => memoryRepo.getTransaction(id)),

  async awardPoints(actor, input): Promise<AwardResult> {
    staff(actor);
    const first = input.studentIds[0];
    const before = await readFresh(async () => ({ teams: await memoryRepo.getTeams(), student: await memoryRepo.findStudent(first) }));
    if (!before.student) throw new Error("Unknown student");
    const { data, error } = await db().rpc("award_points", {
      p_actor: actor.userId,
      p_actor_name: actor.name,
      p_student_ids: input.studentIds,
      p_amount: input.amount,
      p_category: input.categoryId,
      p_reason: input.reason,
      p_event: input.eventId ?? null,
      p_evidence: input.evidenceUrl ?? null,
    });
    if (error) fail(error);
    const snap = await loadSnapshot();
    const teams = await withSnapshot(snap, () => memoryRepo.getTeams());
    const ids = new Set((data.transactions as Row[]).map((t) => t.id));
    const bTeam = before.teams.find((t) => t.id === before.student!.teamId)!;
    const aTeam = teams.find((t) => t.id === before.student!.teamId)!;
    const unlocked: UnlockedAchievement[] = (data.unlocked as Row[])
      .map((u) => ({ studentId: u.student_id, studentName: u.student_name, achievement: snap.achievements.find((a) => a.id === u.achievement_id) as Achievement }))
      .filter((u) => u.achievement);
    if (teams[0].id !== before.teams[0].id) await broadcast("New leader", `${teams[0].name} has taken the #1 spot.`, "rank");
    return {
      transactions: snap.transactions.filter((t) => ids.has(t.id)),
      teamBefore: { rank: bTeam.rank, points: bTeam.points },
      teamAfter: { rank: aTeam.rank, points: aTeam.points, name: aTeam.name },
      leaderChanged: teams[0].id !== before.teams[0].id,
      unlocked,
    };
  },

  async reverseTransaction(actor, id, note) {
    staff(actor);
    const { error } = await db().rpc("reverse_transaction", { p_actor: actor.userId, p_actor_name: actor.name, p_tx: id, p_note: note });
    if (error) fail(error);
  },

  async listEvents() {
    return read(() => memoryRepo.listEvents());
  },
  getEvent: (id) => read(() => memoryRepo.getEvent(id)),
  async saveEvent(actor, input) {
    staff(actor);
    const payload: Row = {
      title: input.title,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startsAt && { starts_at: input.startsAt }),
      ...(input.endsAt && { ends_at: input.endsAt }),
      ...(input.points !== undefined && { points: input.points }),
      ...(input.categoryId && { category_id: input.categoryId }),
      ...(input.location && { location: input.location }),
    };
    let id = input.id;
    if (id) {
      const { error } = await db().from("events").update(payload).eq("id", id);
      if (error) fail(error);
      await audit(actor, "event.update", input.title, "");
    } else {
      if (!payload.starts_at) payload.starts_at = new Date(Date.now() + 7 * 86400000).toISOString();
      if (!payload.ends_at) payload.ends_at = new Date(+new Date(payload.starts_at) + 3 * 3600000).toISOString();
      if (!payload.category_id) payload.category_id = (await readFresh(() => memoryRepo.getCategories()))[0].id;
      const { data, error } = await db().from("events").insert(payload).select("id").single();
      if (error) fail(error);
      id = data.id as string;
      await broadcast("New event", `${input.title} has been scheduled.`, "event");
      await audit(actor, "event.create", input.title, "");
    }
    return (await readFresh(() => memoryRepo.getEvent(id!)))!;
  },
  async deleteEvent(actor, id) {
    staff(actor);
    const ev = await readFresh(() => memoryRepo.getEvent(id));
    const { error } = await db().from("events").delete().eq("id", id);
    if (error) fail(error);
    await audit(actor, "event.delete", ev?.title ?? id, "");
  },
  async registerForEvent(actor, eventId) {
    if (!actor.studentId) throw new Error("Only students can register");
    const ev = await readFresh(() => memoryRepo.getEvent(eventId));
    if (!ev) throw new Error("Event not found");
    if (ev.status === "past") throw new Error("This event has already finished");
    // user-scoped client: row level security enforces that a student can only register themselves
    const user = await createServerSupabase();
    const { error } = await user.from("event_registrations").upsert({ event_id: eventId, student_id: actor.studentId }, { ignoreDuplicates: true });
    if (error) fail(error);
    return (await readFresh(() => memoryRepo.getEvent(eventId)))!;
  },
  async setEventWinner(actor, eventId, teamId, award) {
    staff(actor);
    const snap = await loadSnapshot();
    const ev = snap.events.find((e) => e.id === eventId);
    const team = snap.teams.find((t) => t.id === teamId);
    if (!ev || !team) throw new Error("Event or team not found");
    const { error } = await db().from("events").update({ winner_team_id: teamId }).eq("id", eventId);
    if (error) fail(error);
    await audit(actor, "event.winner", ev.title, `${team.name}${award ? " (points awarded)" : ""}`);
    if (award && ev.points) {
      await supabaseRepo.awardPoints(actor, { studentIds: snap.students.filter((s) => s.teamId === teamId).map((s) => s.id), amount: ev.points, categoryId: ev.categoryId, reason: `Won ${ev.title}`, eventId });
    }
    await broadcast("Event result", `${team.name} won ${ev.title}.`, "event");
  },

  listAchievements: (sid) => read(() => memoryRepo.listAchievements(sid)),
  async saveAchievement(actor, input) {
    staff(actor);
    const row = {
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.icon && { icon: input.icon }),
      ...(input.rarity && { rarity: input.rarity }),
      ...(input.xp !== undefined && { xp: input.xp }),
      ...(input.rule && { rule: input.rule }),
    };
    const q = input.id ? db().from("achievements").update(row).eq("id", input.id) : db().from("achievements").insert(row);
    const { data, error } = await q.select().single();
    if (error) fail(error);
    await audit(actor, input.id ? "achievement.update" : "achievement.create", input.name, "");
    return { id: data.id, name: data.name, description: data.description, icon: data.icon, rarity: data.rarity, xp: data.xp, rule: data.rule, isDemo: data.is_demo };
  },
  async grantAchievement(actor, achievementId, studentId) {
    staff(actor);
    const snap = await loadSnapshot();
    const a = snap.achievements.find((x) => x.id === achievementId);
    const st = snap.students.find((x) => x.id === studentId);
    if (!a || !st) throw new Error("Not found");
    const { error } = await db().from("student_achievements").upsert({ achievement_id: achievementId, student_id: studentId }, { ignoreDuplicates: true });
    if (error) fail(error);
    await notifyStudent(studentId, "Achievement unlocked", `${a.name}: ${a.description}`, "achievement");
    await audit(actor, "achievement.grant", st.name, a.name);
  },

  listSuggestions: (f) => read(() => memoryRepo.listSuggestions(f)),
  async createSuggestion(actor, input) {
    if (!actor.studentId) throw new Error("Only students can submit suggestions");
    const user = await createServerSupabase(); // RLS: student_id must be the caller's own
    const { data, error } = await user
      .from("suggestions")
      .insert({ student_id: actor.studentId, activity: input.activity, description: input.description, category_id: input.categoryId, suggested_points: input.suggestedPoints, evidence_path: input.evidenceUrl })
      .select("id")
      .single();
    if (error) fail(error);
    return (await readFresh(() => memoryRepo.listSuggestions())).find((s) => s.id === data.id)!;
  },
  async reviewSuggestion(actor, id, decision, points, note) {
    staff(actor);
    const sug = (await readFresh(() => memoryRepo.listSuggestions())).find((s) => s.id === id);
    if (!sug) throw new Error("Suggestion not found");
    if (sug.status !== "pending") throw new Error("Already reviewed");
    const amount = decision === "approved" ? (points ?? sug.suggestedPoints) : null;
    const { error } = await db().from("suggestions").update({ status: decision, review_note: note || null, awarded_points: amount, reviewed_by: actor.userId }).eq("id", id).eq("status", "pending");
    if (error) fail(error);
    if (amount) await supabaseRepo.awardPoints(actor, { studentIds: [sug.studentId], amount, categoryId: sug.categoryId, reason: `Approved suggestion: ${sug.activity}` });
    await notifyStudent(sug.studentId, "Suggestion reviewed", `"${sug.activity}" was ${decision}.`, "review");
    await audit(actor, `suggestion.${decision}`, sug.studentName, `${sug.activity}${amount ? ` (+${amount})` : ""}`);
  },

  listDisputes: (f) => read(() => memoryRepo.listDisputes(f)),
  async createDispute(actor, input) {
    if (!actor.studentId) throw new Error("Only students can raise disputes");
    const user = await createServerSupabase(); // RLS: only your own transactions, one open dispute each
    const { data, error } = await user.from("disputes").insert({ transaction_id: input.transactionId, student_id: actor.studentId, reason: input.reason, evidence_path: input.evidenceUrl }).select("id").single();
    if (error) {
      if (error.code === "23505") throw new Error("A dispute is already open for this transaction");
      fail(error, "You can only dispute your own transactions");
    }
    return (await readFresh(() => memoryRepo.listDisputes())).find((d) => d.id === data.id)!;
  },
  async resolveDispute(actor, id, decision, newAmount, note) {
    staff(actor);
    const d = (await readFresh(() => memoryRepo.listDisputes())).find((x) => x.id === id);
    if (!d) throw new Error("Dispute not found");
    if (d.status !== "pending") throw new Error("Already resolved");
    const tx = d.transaction;
    if (decision !== "rejected" && tx && tx.status === "active" && !tx.reversesId) {
      await supabaseRepo.reverseTransaction(actor, tx.id, `dispute ${decision}`);
      if (decision === "modified" && newAmount) {
        await supabaseRepo.awardPoints(actor, { studentIds: [tx.studentId], amount: newAmount, categoryId: tx.categoryId, reason: `Corrected: ${tx.reason}`, eventId: tx.eventId });
      }
    }
    const { error } = await db().from("disputes").update({ status: decision === "rejected" ? "rejected" : "approved", resolution: decision, review_note: note || null, reviewed_by: actor.userId }).eq("id", id);
    if (error) fail(error);
    await notifyStudent(d.studentId, "Dispute resolved", `Your dispute was ${decision}.`, "review");
    await audit(actor, `dispute.${decision}`, d.studentName, note);
  },

  async listNotifications(userId) {
    const [{ data: notes }, { data: state }] = await Promise.all([
      db().from("notifications").select("*").or(`user_id.is.null,user_id.eq.${userId}`).order("created_at", { ascending: false }).limit(50),
      db().from("notification_state").select("*").eq("user_id", userId),
    ]);
    const st = new Map((state ?? []).map((s: Row) => [s.notification_id, s]));
    return (notes ?? [])
      .filter((n: Row) => !st.get(n.id)?.dismissed)
      .map((n: Row): Notification => ({ id: n.id, userId: n.user_id ?? "all", title: n.title, body: n.body, kind: n.kind, read: st.get(n.id)?.read ?? false, createdAt: n.created_at }));
  },
  async markNotificationRead(userId, id) {
    const ids = id === "all" ? (await supabaseRepo.listNotifications(userId)).filter((n) => !n.read).map((n) => n.id) : [id];
    if (!ids.length) return;
    await db().from("notification_state").upsert(ids.map((nid) => ({ user_id: userId, notification_id: nid, read: true })), { onConflict: "user_id,notification_id" });
  },
  async dismissNotification(userId, id) {
    await db().from("notification_state").upsert({ user_id: userId, notification_id: id, read: true, dismissed: true }, { onConflict: "user_id,notification_id" });
  },

  listAudit: (n) => read(() => memoryRepo.listAudit(n)),
  getAnalytics: () => read(() => memoryRepo.getAnalytics()),
  getOverview: () => read(() => memoryRepo.getOverview()),
  previewRoster: (rows) => read(() => memoryRepo.previewRoster(rows)),

  async commitRoster(actor, rows) {
    staff(actor);
    const preview = await readFresh(() => memoryRepo.previewRoster(rows));
    if (preview.issues.length) throw new Error("Fix the highlighted rows first");
    const snap = await loadSnapshot();
    const byName = new Map(snap.teams.map((t) => [t.name.toLowerCase(), t.id]));
    const existing = new Set(snap.students.map((s) => s.id));
    const codes: { studentId: string; name: string; code: string }[] = [];
    for (const r of preview.valid) {
      const team_id = byName.get(r.team.toLowerCase())!;
      const { data, error } = await db().from("students").upsert({ student_id: r.studentId, name: r.name, team_id }).select("student_id,name,team_id,user_id").single();
      if (error) fail(error);
      // keep the profile in step when someone changes team or name
      if (data.user_id) await db().from("profiles").update({ name: r.name, team_id }).eq("id", data.user_id);
      else {
        const code = await provisionStudent(db(), data as any);
        if (code) codes.push({ studentId: r.studentId, name: r.name, code });
      }
    }
    await audit(actor, "roster.import", "roster", `${preview.adds} added, ${preview.updates} updated`);
    void existing;
    return { added: preview.adds, updated: preview.updates, codes };
  },
};

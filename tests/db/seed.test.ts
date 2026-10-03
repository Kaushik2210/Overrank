import { describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { buildStore } from "../../src/lib/data/seed";
import { coreRows, demoRows, resolveRule, type Row } from "../../scripts/rows";
import { expectDenied, freshDb } from "./harness";

async function insertRows(db: PGlite, table: string, rows: Row[]) {
  for (const r of rows) {
    const keys = Object.keys(r);
    const vals = keys.map((k) => (r[k] !== null && typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k]));
    const ph = keys.map((k, i) => (r[k] !== null && typeof r[k] === "object" ? `$${i + 1}::jsonb` : `$${i + 1}`));
    await db.query(`insert into ${table} (${keys.join(",")}) values (${ph.join(",")})`, vals);
  }
}

async function seedCore(db: PGlite) {
  const store = buildStore({ demo: true });
  const core = coreRows(store);
  await insertRows(db, "teams", core.teams);
  await insertRows(db, "point_categories", core.categories);
  const teams = new Map((await db.query<{ id: string; slug: string }>("select id, slug from teams")).rows.map((t) => [t.slug, t.id]));
  const cats = new Map((await db.query<{ id: string; slug: string }>("select id, slug from point_categories")).rows.map((c) => [c.slug, c.id]));
  await insertRows(db, "students", core.students.map((s) => ({ student_id: s.student_id, name: s.name, team_id: teams.get(s.team_slug) })));
  await insertRows(db, "achievements", core.achievements.map((a) => ({ name: a.name, description: a.description, icon: a.icon, rarity: a.rarity, xp: a.xp, rule: resolveRule(a.rule, cats) })));
  const achievements = new Map((await db.query<{ id: string; name: string }>("select id, name from achievements")).rows.map((a) => [a.name, a.id]));
  return { store, teams, cats, achievements };
}

describe("seed rows against a real database", () => {
  it("core seed loads 6 teams, 12 categories and 60 students at zero points", async () => {
    const db = await freshDb();
    await seedCore(db);
    expect((await db.query("select * from teams")).rows).toHaveLength(6);
    expect((await db.query("select * from point_categories")).rows).toHaveLength(12);
    expect((await db.query("select * from students")).rows).toHaveLength(60);
    const pts = await db.query<{ points: number }>("select points from team_points");
    expect(pts.rows.every((r) => r.points === 0)).toBe(true);
  });

  it("demo rows insert cleanly and database totals match the in-memory logic exactly", async () => {
    const db = await freshDb();
    const { store, teams, cats, achievements } = await seedCore(db);
    const rows = demoRows(store, { teams, cats, achievements });
    await insertRows(db, "events", rows.events);
    await insertRows(db, "event_teams", rows.eventTeams);
    await insertRows(db, "achievements", rows.achievements);
    await insertRows(db, "point_transactions", rows.transactionsFirst);
    await insertRows(db, "point_transactions", rows.transactionsSecond);
    await insertRows(db, "student_achievements", rows.studentAchievements);
    await insertRows(db, "audit_logs", rows.audit);

    expect(rows.transactionsFirst.length + rows.transactionsSecond.length).toBeGreaterThanOrEqual(100);

    // team totals
    const expectedTeam = new Map<string, number>();
    for (const t of store.transactions) if (t.status !== "pending") expectedTeam.set(t.teamId.replace("team_", ""), (expectedTeam.get(t.teamId.replace("team_", "")) ?? 0) + t.amount);
    const got = await db.query<{ slug: string; points: number }>("select slug, points from team_points");
    for (const r of got.rows) expect(r.points, r.slug).toBe(expectedTeam.get(r.slug));

    // student totals
    const expectedStudent = new Map<string, number>();
    for (const t of store.transactions) if (t.status !== "pending") expectedStudent.set(t.studentId, (expectedStudent.get(t.studentId) ?? 0) + t.amount);
    const sp = await db.query<{ student_id: string; points: number }>("select student_id, points from student_points");
    for (const r of sp.rows) expect(r.points, r.student_id).toBe(expectedStudent.get(r.student_id) ?? 0);

    // every reversed row is cancelled by its compensating row
    const reversed = await db.query<{ n: number }>("select count(*)::int n from point_transactions o join point_transactions c on c.reverses_id = o.id where o.status = 'reversed' and c.amount = -o.amount");
    expect(reversed.rows[0].n).toBe(3);
    expect((await db.query("select * from achievements where is_demo")).rows).toHaveLength(14);
  });

  it("clearing demo data removes only demo rows and keeps real ones", async () => {
    const db = await freshDb();
    const { store, teams, cats, achievements } = await seedCore(db);
    const rows = demoRows(store, { teams, cats, achievements });
    await insertRows(db, "events", rows.events);
    await insertRows(db, "achievements", rows.achievements);
    await insertRows(db, "point_transactions", rows.transactionsFirst);
    await insertRows(db, "point_transactions", rows.transactionsSecond);
    await insertRows(db, "student_achievements", rows.studentAchievements);
    await insertRows(db, "audit_logs", rows.audit);

    // one genuine transaction that must survive
    const cat = [...cats.values()][0];
    await db.query("insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101', $1, 25, $2, 'Real award')", [teams.get("slytherin"), cat]);

    // the same order scripts/seed-demo-clear.ts uses
    for (const sql of [
      "delete from audit_logs where is_demo",
      "delete from student_achievements where is_demo",
      "delete from point_transactions where is_demo and reverses_id is not null",
      "delete from point_transactions where is_demo",
      "delete from events where is_demo",
      "delete from achievements where is_demo",
    ])
      await db.exec(sql);

    for (const t of ["audit_logs", "student_achievements", "events"]) {
      expect((await db.query(`select * from ${t}`)).rows, t).toHaveLength(0);
    }
    expect((await db.query("select * from point_transactions")).rows).toHaveLength(1);
    expect((await db.query("select * from students")).rows).toHaveLength(60);
    expect((await db.query("select * from teams")).rows).toHaveLength(6);
    expect((await db.query("select * from achievements")).rows).toHaveLength(6); // only the core set remains
    await expectDenied(db.exec("delete from point_transactions"));
  });
});

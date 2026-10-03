import { beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, expectDenied, freshDb, seedBasics, type Seeded } from "./harness";

let db: PGlite;
let s: Seeded;

beforeEach(async () => {
  db = await freshDb();
  s = await seedBasics(db);
});

type AwardRow = { award_points: { transactions: { id: string }[]; unlocked: unknown[] } };
const award = (amount: number, ids = ["2647101"], cat?: string) =>
  db.query<AwardRow>("select public.award_points($1, 'Admin', $2::text[], $3, $4, 'Won the race')", [s.u.admin, ids, amount, cat ?? s.sports]);

describe("migrations", () => {
  it("apply cleanly and create exactly the faculty-only table set", async () => {
    const { rows } = await db.query<{ table_name: string }>("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1");
    expect(rows.map((r) => r.table_name)).toEqual([
      "achievements", "audit_logs", "event_teams", "events", "point_categories", "point_transactions",
      "profiles", "rank_events", "settings", "student_achievements", "students", "teams",
    ]);
  });
});

describe("totals are derived", () => {
  it("team and student totals follow the ledger", async () => {
    await award(40, ["2647101", "2647102"]);
    await award(15, ["2647110"]);
    const t = await db.query<{ slug: string; points: number }>("select slug, points from team_points order by slug");
    expect(t.rows).toEqual([
      { slug: "alpha", points: 80 },
      { slug: "beta", points: 15 },
    ]);
    const st = await db.query<{ points: number }>("select points from student_points where student_id='2647101'");
    expect(st.rows[0].points).toBe(40);
  });

  it("pending rows are left out of totals", async () => {
    await db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason, status) values ('2647101','${s.teamA}', 99, '${s.sports}', 'wait', 'pending')`);
    const st = await db.query<{ points: number }>("select points from student_points where student_id='2647101'");
    expect(st.rows[0].points).toBe(0);
  });
});

describe("ledger is append-only", () => {
  it("blocks edits to amount and deletion, even for the service role", async () => {
    await award(25);
    await as(db, "service_role", async () => {
      expect(await expectDenied(db.exec("update point_transactions set amount = 9999"))).toMatch(/immutable/);
      expect(await expectDenied(db.exec("delete from point_transactions"))).toMatch(/cannot be deleted/);
    });
  });

  it("lets only flagged demo rows be deleted", async () => {
    await award(25);
    await db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason, is_demo) values ('2647101','${s.teamA}', 10, '${s.sports}', 'demo', true)`);
    await as(db, "service_role", async () => {
      await db.exec("delete from point_transactions where is_demo");
      expect(await expectDenied(db.exec("delete from point_transactions"))).toMatch(/cannot be deleted/);
    });
    expect((await db.query("select * from point_transactions")).rows).toHaveLength(1);
  });

  it("forces the team to match the student", async () => {
    await db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamB}', 5, '${s.sports}', 'wrong team')`);
    const r = await db.query<{ team_id: string }>("select team_id from point_transactions limit 1");
    expect(r.rows[0].team_id).toBe(s.teamA);
  });

  it("rejects a zero amount", async () => {
    await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 0, '${s.sports}', 'nothing')`));
  });
});

describe("reversal", () => {
  it("adds a compensating row, keeps history and nets to zero", async () => {
    const res = await award(60);
    const txId = res.rows[0].award_points.transactions[0].id;
    await db.query("select public.reverse_transaction($1, 'Admin', $2, 'entered twice')", [s.u.admin, txId]);
    const rows = await db.query<{ status: string; amount: number; reverses_id: string | null }>("select status, amount, reverses_id from point_transactions");
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows.find((r) => r.reverses_id)?.amount).toBe(-60);
    expect(rows.rows.find((r) => !r.reverses_id)?.status).toBe("reversed");
    expect((await db.query<{ points: number }>("select points from student_points where student_id='2647101'")).rows[0].points).toBe(0);
    await expectDenied(db.query("select public.reverse_transaction($1, 'Admin', $2, '')", [s.u.admin, txId]));
  });
});

describe("achievements", () => {
  it("unlock automatically at a points threshold, once", async () => {
    await db.exec(`insert into achievements (name, rule) values ('Century', '{"kind":"points","threshold":100}')`);
    expect((await award(60)).rows[0].award_points.unlocked).toHaveLength(0);
    expect((await award(60)).rows[0].award_points.unlocked).toHaveLength(1);
    expect((await award(60)).rows[0].award_points.unlocked).toHaveLength(0);
    expect((await db.query("select * from student_achievements")).rows).toHaveLength(1);
  });

  it("unlock on category thresholds", async () => {
    await db.exec(`insert into achievements (name, rule) values ('Sportsperson', '{"kind":"category","categoryId":"${s.sports}","threshold":50}')`);
    expect((await award(30, ["2647101"], s.other)).rows[0].award_points.unlocked).toHaveLength(0);
    expect((await award(60, ["2647101"], s.sports)).rows[0].award_points.unlocked).toHaveLength(1);
  });
});

describe("RPC rules", () => {
  it("refuses an actor with no faculty profile", async () => {
    await expectDenied(db.query("select public.award_points($1, 'Nobody', array['2647101'], 50, $2, 'self award')", [s.u.stranger, s.sports]));
  });
  it("refuses out-of-range amounts and unknown students", async () => {
    await expectDenied(award(5000));
    await expectDenied(award(10, ["9999999"]));
  });
  it("writes an audit entry for every award", async () => {
    await award(10);
    const a = await db.query<{ action: string; actor_name: string }>("select action, actor_name from audit_logs");
    expect(a.rows).toEqual([{ action: "points.award", actor_name: "Admin" }]);
  });
});

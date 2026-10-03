import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, expectDenied, freshDb, seedBasics, type Seeded } from "./harness";

let db: PGlite;
let s: Seeded;
let txA: string; // belongs to student 2647101
let txC: string; // belongs to student 2647110

beforeAll(async () => {
  db = await freshDb();
  s = await seedBasics(db);
  const mk = async (sid: string, amt: number) => {
    const r = await db.query<{ award_points: { transactions: { id: string }[] } }>("select public.award_points($1, 'Admin', array[$2]::text[], $3, $4, 'Seed')", [s.u.admin, sid, amt, s.sports]);
    return r.rows[0].award_points.transactions[0].id;
  };
  txA = await mk("2647101", 30);
  txC = await mk("2647110", 20);
});

const count = async (sql: string) => (await db.query<{ n: number }>(`select count(*)::int n from (${sql}) q`)).rows[0].n;

describe("anonymous visitors", () => {
  it("can read the public leaderboard and teams, nothing private", async () => {
    await as(db, "anon", async () => {
      expect(await count("select * from team_points")).toBe(2);
      expect(await count("select * from teams")).toBe(2);
      expect(await count("select * from point_categories")).toBe(2);
      expect(await count("select * from point_transactions")).toBe(0);
      expect(await count("select * from students")).toBe(0);
      expect(await count("select * from profiles")).toBe(0);
      expect(await count("select * from audit_logs")).toBe(0);
      expect(await count("select * from suggestions")).toBe(0);
      await expectDenied(db.exec("select * from student_points"));
    });
  });
  it("cannot write anything", async () => {
    await as(db, "anon", async () => {
      await expectDenied(db.exec("insert into teams (name, slug, color_primary, color_glow) values ('X','x','#000000','#000000')"));
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 5, '${s.sports}', 'x')`));
    });
  });
  it("cannot call the award RPC", async () => {
    await as(db, "anon", async () => {
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 5, $2, 'x')", [s.u.admin, s.sports]));
    });
  });
  it("cannot read one-time login codes", async () => {
    await db.exec("insert into login_codes (student_id, code_hash) values ('2647101', 'hash')");
    await as(db, "anon", async () => expect(await count("select * from login_codes")).toBe(0));
    await as(db, { user: s.u.s1 }, async () => expect(await count("select * from login_codes")).toBe(0));
  });
});

describe("students", () => {
  it("see only their own ledger rows", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      const ids = (await db.query<{ id: string }>("select id from point_transactions")).rows.map((r) => r.id);
      expect(ids).toEqual([txA]);
    });
  });

  it("cannot insert, update or delete ledger rows", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 500, '${s.sports}', 'cheat')`));
      expect(await db.query("update point_transactions set status = 'pending' where id = '" + txA + "'")).toMatchObject({ affectedRows: 0 });
      expect(await db.query("delete from point_transactions where id = '" + txA + "'")).toMatchObject({ affectedRows: 0 });
    });
    expect(await count("select * from point_transactions")).toBe(2);
  });

  it("cannot call the point RPCs, even naming themselves as staff", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 500, $2, 'cheat')", [s.u.admin, s.sports]));
      await expectDenied(db.query("select public.reverse_transaction($1, 'x', $2, '')", [s.u.admin, txA]));
    });
  });

  it("cannot promote themselves or edit their profile", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      expect(await db.query(`update profiles set role = 'admin' where id = '${s.u.s1}'`)).toMatchObject({ affectedRows: 0 });
      await expectDenied(db.exec(`insert into profiles (id, role, name) values (gen_random_uuid(), 'admin', 'Evil')`));
    });
    const r = await db.query<{ role: string }>(`select role from profiles where id = '${s.u.s1}'`);
    expect(r.rows[0].role).toBe("student");
  });

  it("can read teams, badges and the roster but not other profiles or the audit log", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      expect(await count("select * from students")).toBe(3);
      expect(await count("select * from profiles")).toBe(1);
      expect(await count("select * from audit_logs")).toBe(0);
    });
  });

  it("can file their own suggestion, but not for someone else or pre-approved", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      await db.exec(`insert into suggestions (student_id, activity, description, category_id, suggested_points) values ('2647101','Chess win','Won the college chess final.','${s.other}', 40)`);
      await expectDenied(db.exec(`insert into suggestions (student_id, activity, description, category_id, suggested_points) values ('2647110','Fake','Pretending to be someone else.','${s.other}', 40)`));
      await expectDenied(db.exec(`insert into suggestions (student_id, activity, description, category_id, suggested_points, status, awarded_points) values ('2647101','Self approve','Approving my own request.','${s.other}', 40, 'approved', 40)`));
      expect(await db.query("update suggestions set status = 'approved'")).toMatchObject({ affectedRows: 0 });
    });
  });

  it("can dispute only their own transactions, once at a time", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      await expectDenied(db.exec(`insert into disputes (transaction_id, student_id, reason) values ('${txC}', '2647101', 'This is not mine at all')`));
      await db.exec(`insert into disputes (transaction_id, student_id, reason) values ('${txA}', '2647101', 'I was not at this event')`);
      await expectDenied(db.exec(`insert into disputes (transaction_id, student_id, reason) values ('${txA}', '2647101', 'Filing the same one again')`));
      expect(await db.query("update disputes set status = 'approved'")).toMatchObject({ affectedRows: 0 });
    });
  });

  it("see their own notifications and broadcasts, nobody else's", async () => {
    await db.exec(`insert into notifications (user_id, title, body, kind) values ('${s.u.s2}', 'Private', 'only for Bea', 'points'), (null, 'Everyone', 'broadcast', 'system')`);
    await as(db, { user: s.u.s1 }, async () => {
      const t = (await db.query<{ title: string }>("select title from notifications order by title")).rows.map((r) => r.title);
      expect(t).not.toContain("Private");
      expect(t).toContain("Everyone");
    });
  });

  it("cannot edit teams, categories, events or settings", async () => {
    await as(db, { user: s.u.s1 }, async () => {
      expect(await db.query("update teams set name = 'Hacked'")).toMatchObject({ affectedRows: 0 });
      expect(await db.query("update settings set value = '{}'")).toMatchObject({ affectedRows: 0 });
      await expectDenied(db.exec("insert into point_categories (name, slug) values ('Cheat','cheat')"));
    });
  });
});

describe("staff", () => {
  it("read everything", async () => {
    await as(db, { user: s.u.admin }, async () => {
      expect(await count("select * from point_transactions")).toBe(2);
      expect(await count("select * from profiles")).toBe(4);
      expect(await count("select * from audit_logs")).toBeGreaterThan(0);
      expect(await count("select * from suggestions")).toBe(1);
    });
  });
  it("can review a suggestion and edit teams from the client", async () => {
    await as(db, { user: s.u.admin }, async () => {
      expect(await db.query("update suggestions set status = 'approved', awarded_points = 40")).toMatchObject({ affectedRows: 1 });
      expect(await db.query("update teams set motto = 'Go' where slug = 'alpha'")).toMatchObject({ affectedRows: 1 });
    });
  });
  it("still cannot write the ledger directly, only through the RPCs", async () => {
    await as(db, { user: s.u.admin }, async () => {
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 5, '${s.sports}', 'direct')`));
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 5, $2, 'x')", [s.u.admin, s.sports]));
    });
  });
});

describe("service role", () => {
  it("can call the RPCs and bypass RLS for reads", async () => {
    await as(db, "service_role", async () => {
      const r = await db.query("select public.award_points($1, 'Admin', array['2647102'], 5, $2, 'rpc')", [s.u.admin, s.sports]);
      expect(r.rows).toHaveLength(1);
      expect(await count("select * from point_transactions")).toBeGreaterThan(2);
    });
  });
});

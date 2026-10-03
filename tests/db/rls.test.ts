import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, expectDenied, freshDb, seedBasics, type Seeded } from "./harness";

let db: PGlite;
let s: Seeded;
let txA: string;

beforeAll(async () => {
  db = await freshDb();
  s = await seedBasics(db);
  const r = await db.query<{ award_points: { transactions: { id: string }[] } }>("select public.award_points($1, 'Admin', array['2647101']::text[], 30, $2, 'Seed')", [s.u.admin, s.sports]);
  txA = r.rows[0].award_points.transactions[0].id;
  await db.query("select public.award_points($1, 'Admin', array['2647110']::text[], 20, $2, 'Seed')", [s.u.admin, s.sports]);
});

const count = async (sql: string) => (await db.query<{ n: number }>(`select count(*)::int n from (${sql}) q`)).rows[0].n;

describe("anonymous visitors", () => {
  it("can read the public leaderboard and reference data, nothing private", async () => {
    await as(db, "anon", async () => {
      expect(await count("select * from team_points")).toBe(2);
      expect(await count("select * from teams")).toBe(2);
      expect(await count("select * from point_categories")).toBe(2);
      expect(await count("select * from settings")).toBeGreaterThan(0);
      expect(await count("select * from point_transactions")).toBe(0);
      expect(await count("select * from students")).toBe(0);
      expect(await count("select * from profiles")).toBe(0);
      expect(await count("select * from audit_logs")).toBe(0);
      await expectDenied(db.exec("select * from student_points"));
    });
  });
  it("cannot write anything", async () => {
    await as(db, "anon", async () => {
      await expectDenied(db.exec("insert into teams (name, slug, color_primary, color_glow) values ('X','x','#000000','#000000')"));
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 5, '${s.sports}', 'x')`));
    });
  });
  it("cannot call the point RPCs", async () => {
    await as(db, "anon", async () => {
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 5, $2, 'x')", [s.u.admin, s.sports]));
      await expectDenied(db.query("select public.reverse_transaction($1, 'x', $2, '')", [s.u.admin, txA]));
    });
  });
});

describe("a signed-in user with no faculty profile (for example someone who signed up on their own)", () => {
  it("sees exactly what an anonymous visitor sees", async () => {
    await as(db, { user: s.u.stranger }, async () => {
      expect(await count("select * from team_points")).toBe(2);
      expect(await count("select * from point_transactions")).toBe(0);
      expect(await count("select * from students")).toBe(0);
      expect(await count("select * from profiles")).toBe(0);
      expect(await count("select * from audit_logs")).toBe(0);
      expect(await count("select * from student_achievements")).toBe(0);
    });
  });
  it("cannot write, promote themselves or call the RPCs, even naming a real admin", async () => {
    await as(db, { user: s.u.stranger }, async () => {
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 500, '${s.sports}', 'cheat')`));
      await expectDenied(db.exec(`insert into profiles (id, role, name) values ('${s.u.stranger}', 'admin', 'Me')`));
      expect(await db.query("update teams set name = 'Hacked'")).toMatchObject({ affectedRows: 0 });
      expect(await db.query("update settings set value = '{}'")).toMatchObject({ affectedRows: 0 });
      await expectDenied(db.exec("insert into point_categories (name, slug) values ('Cheat','cheat')"));
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 500, $2, 'cheat')", [s.u.admin, s.sports]));
    });
    expect(await count("select * from point_transactions")).toBe(2);
  });
});

describe("faculty", () => {
  it("read everything they need", async () => {
    for (const user of [s.u.admin, s.u.teacher]) {
      await as(db, { user }, async () => {
        expect(await count("select * from point_transactions")).toBe(2);
        expect(await count("select * from students")).toBe(3);
        expect(await count("select * from audit_logs")).toBeGreaterThan(0);
        expect(await count("select * from profiles")).toBeGreaterThanOrEqual(1);
      });
    }
  });
  it("can edit teams and reference data from the client", async () => {
    await as(db, { user: s.u.admin }, async () => {
      expect(await db.query("update teams set motto = 'Go' where slug = 'alpha'")).toMatchObject({ affectedRows: 1 });
    });
  });
  it("still cannot write the ledger or call the RPCs directly from the client", async () => {
    await as(db, { user: s.u.admin }, async () => {
      await expectDenied(db.exec(`insert into point_transactions (student_id, team_id, amount, category_id, reason) values ('2647101','${s.teamA}', 5, '${s.sports}', 'direct')`));
      await expectDenied(db.query("select public.award_points($1, 'x', array['2647101'], 5, $2, 'x')", [s.u.admin, s.sports]));
      expect(await db.query("update point_transactions set status = 'pending'")).toMatchObject({ affectedRows: 0 });
    });
  });
  it("cannot change their own role", async () => {
    await as(db, { user: s.u.teacher }, async () => {
      expect(await db.query(`update profiles set role = 'admin' where id = '${s.u.teacher}'`)).toMatchObject({ affectedRows: 0 });
    });
    expect((await db.query<{ role: string }>(`select role from profiles where id = '${s.u.teacher}'`)).rows[0].role).toBe("teacher");
  });
});

describe("service role", () => {
  it("can call the RPCs and read everything", async () => {
    await as(db, "service_role", async () => {
      const r = await db.query("select public.award_points($1, 'Admin', array['2647102'], 5, $2, 'rpc')", [s.u.admin, s.sports]);
      expect(r.rows).toHaveLength(1);
      expect(await count("select * from point_transactions")).toBeGreaterThan(2);
    });
  });
});

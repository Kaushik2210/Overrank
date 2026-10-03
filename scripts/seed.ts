/**
 * npm run seed
 * Idempotent. Creates the teams, categories, students (from data/roster.json), core achievements, launch
 * events and one faculty admin account. Students do not sign in, so no student accounts are created.
 * Real students start at 0 points. Re-running never overwrites edits made in the admin area.
 */
import { randomBytes } from "node:crypto";
import { buildStore } from "../src/lib/data/seed";
import { coreRows, resolveRule } from "./rows";
import { adminClient, must } from "./env";

async function main() {
  const db = adminClient();
  const store = buildStore({ demo: false });
  const rows = coreRows(store);

  // insert-only: never touch rows that already exist, so admin edits survive a re-seed
  must(await db.from("teams").upsert(rows.teams, { onConflict: "slug", ignoreDuplicates: true }), "teams");
  must(await db.from("point_categories").upsert(rows.categories, { onConflict: "slug", ignoreDuplicates: true }), "categories");

  const teams = new Map(must(await db.from("teams").select("id,slug"), "read teams").map((t) => [t.slug as string, t.id as string]));
  const cats = new Map(must(await db.from("point_categories").select("id,slug"), "read categories").map((c) => [c.slug as string, c.id as string]));

  must(
    await db.from("students").upsert(
      rows.students.map((s) => ({ student_id: s.student_id, name: s.name, team_id: teams.get(s.team_slug) })),
      { onConflict: "student_id", ignoreDuplicates: true },
    ),
    "students",
  );

  const haveAch = new Set(must(await db.from("achievements").select("name"), "read achievements").map((a) => a.name as string));
  const newAch = rows.achievements.filter((a) => !haveAch.has(a.name));
  if (newAch.length) {
    must(
      await db.from("achievements").insert(newAch.map((a) => ({ name: a.name, description: a.description, icon: a.icon, rarity: a.rarity, xp: a.xp, rule: resolveRule(a.rule, cats) }))),
      "achievements",
    );
  }

  const { count } = await db.from("events").select("id", { count: "exact", head: true }).eq("is_demo", false);
  if (!count) {
    must(
      await db.from("events").insert(
        rows.events.map((e) => ({ title: e.title, description: e.description, starts_at: e.startsAt, ends_at: e.endsAt, points: e.points, category_id: cats.get(e.categoryId.replace(/^cat_/, "")), location: e.location })),
      ),
      "events",
    );
  }

  // admin account
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@overrank.local").toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD;
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingAdmin = list?.users.find((u) => u.email?.toLowerCase() === adminEmail);
  let printedPassword = false;
  if (!existingAdmin) {
    if (!adminPassword) {
      adminPassword = randomBytes(12).toString("base64url");
      printedPassword = true;
    }
    const created = await db.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true });
    if (created.error || !created.data.user) throw new Error(`admin: ${created.error?.message}`);
    must(await db.from("profiles").upsert({ id: created.data.user.id, role: "admin", name: "Faculty Admin" }), "admin profile");
  }

  const students = must(await db.from("students").select("student_id"), "read students");

  console.log(`Seeded ${teams.size} teams, ${cats.size} categories, ${students.length} students.`);
  console.log(`Admin sign-in: ${adminEmail}`);
  if (printedPassword) console.log(`Admin password (shown once, change it after signing in): ${adminPassword}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

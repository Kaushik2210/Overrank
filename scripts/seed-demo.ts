/**
 * npm run seed:demo
 * Adds eight weeks of invented activity so the UI looks alive. Every row is flagged is_demo = true and
 * `npm run seed:demo:clear` removes all of it. Never run this against a real season.
 */
import { buildStore } from "../src/lib/data/seed";
import { demoRows, type Row } from "./rows";
import { adminClient, must } from "./env";

async function insertChunks(db: ReturnType<typeof adminClient>, table: string, rows: Row[], size = 200) {
  for (let i = 0; i < rows.length; i += size) must(await db.from(table).insert(rows.slice(i, i + size)), table);
}

async function main() {
  const db = adminClient();
  const { count } = await db.from("point_transactions").select("id", { count: "exact", head: true }).eq("is_demo", true);
  if (count) {
    console.error("Demo data is already loaded. Run `npm run seed:demo:clear` first.");
    process.exit(1);
  }

  const teams = new Map(must(await db.from("teams").select("id,slug"), "teams").map((t) => [t.slug as string, t.id as string]));
  const cats = new Map(must(await db.from("point_categories").select("id,slug"), "categories").map((c) => [c.slug as string, c.id as string]));
  const achievements = new Map(must(await db.from("achievements").select("id,name"), "achievements").map((a) => [a.name as string, a.id as string]));
  if (!teams.size) {
    console.error("Run `npm run seed` first.");
    process.exit(1);
  }

  const rows = demoRows(buildStore({ demo: true }), { teams, cats, achievements });
  await insertChunks(db, "events", rows.events);
  await insertChunks(db, "event_teams", rows.eventTeams);
  await insertChunks(db, "achievements", rows.achievements);
  await insertChunks(db, "point_transactions", rows.transactionsFirst);
  await insertChunks(db, "point_transactions", rows.transactionsSecond);
  await insertChunks(db, "student_achievements", rows.studentAchievements);
  await insertChunks(db, "suggestions", rows.suggestions);
  await insertChunks(db, "disputes", rows.disputes);
  await insertChunks(db, "notifications", rows.notifications);
  await insertChunks(db, "audit_logs", rows.audit);

  console.log(`Demo data loaded: ${rows.transactionsFirst.length + rows.transactionsSecond.length} transactions, ${rows.events.length} events, ${rows.achievements.length} extra achievements.`);
  console.log("Remove it any time with: npm run seed:demo:clear");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * npm run seed:demo:clear
 * Removes every row flagged is_demo. Real roster data and real transactions are untouched
 * (the ledger trigger refuses to delete anything that is not flagged demo).
 */
import { adminClient, must } from "./env";

async function del(db: ReturnType<typeof adminClient>, table: string, build?: (q: any) => any) {
  const base = db.from(table).delete().eq("is_demo", true);
  must(await (build ? build(base) : base), `clear ${table}`);
}

async function main() {
  const db = adminClient();
  await del(db, "disputes");
  await del(db, "suggestions");
  await del(db, "notifications");
  await del(db, "audit_logs");
  await del(db, "student_achievements");
  // compensating rows first, because they reference the originals
  await del(db, "point_transactions", (q) => q.not("reverses_id", "is", null));
  await del(db, "point_transactions");
  await del(db, "events");
  await del(db, "achievements");
  console.log("Demo data removed. Real data is untouched.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

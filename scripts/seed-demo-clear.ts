/**
 * npm run seed:demo:clear
 * Removes every row flagged is_demo. Real roster data and real transactions are untouched
 * (the ledger trigger refuses to delete anything that is not flagged demo).
 */
import { adminClient, must } from "./env";

async function main() {
  const db = adminClient();
  const flagged = (table: string) => db.from(table).delete().eq("is_demo", true);

  must(await flagged("audit_logs"), "clear audit logs");
  must(await flagged("student_achievements"), "clear unlocked badges");
  // compensating rows first, because they reference the originals
  must(await flagged("point_transactions").not("reverses_id", "is", null), "clear reversal rows");
  must(await flagged("point_transactions"), "clear transactions");
  must(await flagged("events"), "clear events");
  must(await flagged("achievements"), "clear achievements");
  console.log("Demo data removed. Real data is untouched.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

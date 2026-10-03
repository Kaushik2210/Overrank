import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { TxQuery } from "@/lib/data/types";

export const dynamic = "force-dynamic";

/** Spreadsheet apps run cells that start with these as formulas, so neutralise them. */
const safe = (v: string | number) => {
  const s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};
const cell = (v: string | number) => `"${safe(v).replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const q: TxQuery = {
    q: sp.get("q") ?? undefined,
    teamId: sp.get("team") ?? undefined,
    categoryId: sp.get("category") ?? undefined,
    status: (sp.get("status") as TxQuery["status"]) ?? undefined,
    sort: (sp.get("sort") as TxQuery["sort"]) ?? "newest",
    pageSize: 500,
  };
  const { rows } = await getRepo().listTransactions(q);
  const head = ["Date", "Student ID", "Student", "Team", "Category", "Points", "Reason", "Event", "Awarded by", "Status"];
  const lines = [
    head.map(cell).join(","),
    ...rows.map((t) => [new Date(t.createdAt).toISOString(), t.studentId, t.studentName, t.teamName, t.categoryName, t.amount, t.reason, t.eventTitle ?? "", t.awardedBy, t.status].map(cell).join(",")),
  ];
  return new NextResponse(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="overrank-ledger-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}

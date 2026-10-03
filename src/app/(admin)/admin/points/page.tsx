import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { QuickAward } from "@/components/admin/QuickAward";
import { AdminHeader } from "@/components/admin/bits";
import { LedgerToolbar } from "@/components/points/LedgerToolbar";
import { StatusPill, TransactionCard } from "@/components/points/TransactionCard";
import { getRepo } from "@/lib/data";
import { cn, signed } from "@/lib/utils";
import type { TxQuery } from "@/lib/data/types";

export const metadata: Metadata = { title: "Manage points" };
export const dynamic = "force-dynamic";

const PAGE = 15;
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" });

function SortIcon({ on, down }: { on: boolean; down: boolean }) {
  if (!on) return null;
  return down ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />;
}

type SP = { q?: string; team?: string; category?: string; status?: string; sort?: string; page?: string };

export default async function PointsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const repo = getRepo();
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = (["newest", "oldest", "amount_desc", "amount_asc"].includes(sp.sort ?? "") ? sp.sort : "newest") as NonNullable<TxQuery["sort"]>;
  const [{ rows, total }, teams, categories] = await Promise.all([
    repo.listTransactions({ q: sp.q, teamId: sp.team, categoryId: sp.category, status: sp.status as TxQuery["status"], sort, page, pageSize: PAGE }),
    repo.getTeams(),
    repo.getCategories(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/points?${p.toString()}`;
  };
  const dateSort = sort === "newest" ? "oldest" : "newest";
  const amtSort = sort === "amount_desc" ? "amount_asc" : "amount_desc";

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader title="Manage points" description="The full ledger. Every award, deduction and reversal is kept." actions={<QuickAward />} />
      <LedgerToolbar teams={teams} categories={categories} />

      {rows.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-dim">No transactions match these filters.</div>
      ) : (
        <>
          {/* desktop table */}
          <div className="glass hidden overflow-hidden rounded-lg md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[11px] tracking-wider text-faint uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <Link href={href({ sort: dateSort, page: undefined })} className="inline-flex items-center gap-1 hover:text-ink">
                      Date <SortIcon on={sort === "newest" || sort === "oldest"} down={sort === "newest"} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <Link href={href({ sort: amtSort, page: undefined })} className="inline-flex items-center gap-1 hover:text-ink">
                      Points <SortIcon on={sort.startsWith("amount")} down={sort === "amount_desc"} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id} className="group transition-colors hover:bg-surface">
                    <td className="num px-4 py-3 whitespace-nowrap text-dim">{date.format(new Date(t.createdAt))}</td>
                    <td className="px-4 py-3">
                      <Link href={`/transactions/${t.id}`} className="flex items-center gap-2 font-medium group-hover:text-accent">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: t.teamColor }} aria-hidden />
                        {t.studentName}
                      </Link>
                      <span className="num ml-4 text-xs text-faint">{t.studentId}</span>
                    </td>
                    <td className="px-4 py-3 text-dim">{t.categoryName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-dim">{t.reason}</td>
                    <td className={cn("num px-4 py-3 text-right text-base font-semibold", t.amount >= 0 ? "text-success" : "text-danger", t.status === "reversed" && "line-through opacity-60")}>{signed(t.amount)}</td>
                    <td className="px-4 py-3">{t.status === "active" ? <span className="text-xs text-faint">Active</span> : <StatusPill status={t.status} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* phone cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((t) => (
              <TransactionCard key={t.id} tx={t} href={`/transactions/${t.id}`} />
            ))}
          </div>

          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
            <p className="num text-sm text-faint">
              {(page - 1) * PAGE + 1}-{Math.min(page * PAGE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Link aria-disabled={page <= 1} href={href({ page: String(page - 1) })} className={cn("flex h-11 items-center gap-1 rounded-md border border-line px-3 text-sm", page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-2")}>
                <ChevronLeft className="size-4" /> Prev
              </Link>
              <Link aria-disabled={page >= pages} href={href({ page: String(page + 1) })} className={cn("flex h-11 items-center gap-1 rounded-md border border-line px-3 text-sm", page >= pages ? "pointer-events-none opacity-40" : "hover:bg-surface-2")}>
                Next <ChevronRight className="size-4" />
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

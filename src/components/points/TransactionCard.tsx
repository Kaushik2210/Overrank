import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { cn, signed } from "@/lib/utils";
import type { PointTransaction } from "@/lib/data/types";

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function StatusPill({ status }: { status: PointTransaction["status"] }) {
  if (status === "active") return null;
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] tracking-wider uppercase", status === "reversed" ? "border-danger/40 text-danger" : "border-warn/40 text-warn")}>
      {status}
    </span>
  );
}

/** A single ledger entry as a card. Used on phones, profiles and team pages. */
export function TransactionCard({ tx, href, showStudent = true }: { tx: PointTransaction; href?: string; showStudent?: boolean }) {
  const inner = (
    <div className="flex items-center gap-4">
      <div className={cn("num w-16 shrink-0 text-right text-2xl font-semibold", tx.amount >= 0 ? "text-success" : "text-danger", tx.status === "reversed" && "line-through opacity-60")}>{signed(tx.amount)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.reason}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-faint">
          {showStudent && <span className="text-dim">{tx.studentName}</span>}
          <span>{tx.categoryName}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" aria-hidden />
            {date.format(new Date(tx.createdAt))}
          </span>
        </p>
      </div>
      <StatusPill status={tx.status} />
    </div>
  );
  const cls = "glass block rounded-lg p-4 transition-colors";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-line-strong active:bg-surface-2")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

import { Check, CalendarCheck, FileText, ShieldCheck, Trophy, UserCheck } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "./TransactionCard";
import { Timeline } from "@/components/ui/Timeline";
import { cn, signed } from "@/lib/utils";
import type { PointTransaction } from "@/lib/data/types";

const full = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

/** Transaction summary plus the Event > Participation > Verification > Awarded > Leaderboard timeline. */
export function TransactionDetail({ tx, evidenceHref }: { tx: PointTransaction; evidenceHref?: string | null }) {
  const at = full.format(new Date(tx.createdAt));
  const ic = "size-3";
  const steps = [
    ...(tx.eventTitle ? [{ id: "event", title: "Event", detail: tx.eventTitle, icon: <CalendarCheck className={ic} /> }] : []),
    { id: "part", title: "Participation", detail: `${tx.studentName} (${tx.teamName}) took part in ${tx.categoryName.toLowerCase()}.`, icon: <UserCheck className={ic} /> },
    { id: "verify", title: "Verification", detail: `Verified by ${tx.awardedBy}. ${tx.reason}`, icon: <ShieldCheck className={ic} /> },
    { id: "award", title: tx.amount >= 0 ? "Points awarded" : "Points deducted", detail: signed(tx.amount), at, icon: <Trophy className={ic} />, tone: tx.amount >= 0 ? ("success" as const) : ("danger" as const) },
    { id: "lb", title: "Leaderboard updated", detail: `${tx.teamName} standings recalculated.`, icon: <Check className={ic} /> },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="glass rounded-xl p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-wider text-faint uppercase">{tx.categoryName}</p>
          <StatusPill status={tx.status} />
        </div>
        <p className={cn("num mt-4 text-6xl font-bold", tx.amount >= 0 ? "text-success" : "text-danger", tx.status === "reversed" && "line-through opacity-60")}>{signed(tx.amount)}</p>
        <p className="mt-4 text-lg font-medium">{tx.reason}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Student</dt>
            <dd>
              <Link href={`/students/${tx.studentId}`} className="hover:text-accent">
                {tx.studentName}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Team</dt>
            <dd style={{ color: tx.teamColor }}>{tx.teamName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Awarded by</dt>
            <dd>{tx.awardedBy}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Date</dt>
            <dd>{at}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Reference</dt>
            <dd className="num text-xs break-all text-dim">{tx.id}</dd>
          </div>
        </dl>
        {evidenceHref && (
          <a href={evidenceHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-accent hover:underline">
            <FileText className="size-4" aria-hidden /> View evidence
          </a>
        )}
      </div>

      <div className="glass rounded-xl p-6 lg:col-span-3">
        <h2 className="mb-6 font-display text-lg font-semibold">Journey of this transaction</h2>
        <Timeline items={steps} />
      </div>
    </div>
  );
}

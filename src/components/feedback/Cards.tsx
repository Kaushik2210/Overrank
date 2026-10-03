"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { cn, signed, timeAgo } from "@/lib/utils";
import type { Dispute, ReviewStatus, Suggestion } from "@/lib/data/types";

const META: Record<ReviewStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: "Pending", cls: "border-warn/40 bg-warn/10 text-warn", Icon: Clock },
  approved: { label: "Approved", cls: "border-success/40 bg-success/10 text-success", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "border-danger/40 bg-danger/10 text-danger", Icon: XCircle },
};

/** Swaps with a short scale animation whenever the status changes. */
export function StatusBadge({ status }: { status: ReviewStatus }) {
  const m = META[status];
  return (
    <span className="relative inline-flex h-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.7, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium", m.cls)}
        >
          <m.Icon className="size-3.5" aria-hidden />
          {m.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Evidence({ href }: { href?: string | null }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
      <FileText className="size-3.5" aria-hidden /> Evidence
    </a>
  );
}

export function SuggestionCard({ s, evidenceHref, footer }: { s: Suggestion; evidenceHref?: string | null; footer?: React.ReactNode }) {
  return (
    <article className="glass rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight font-bold">{s.activity}</h3>
          <p className="mt-0.5 text-xs text-faint">
            {s.studentName} · {s.categoryName} · {timeAgo(s.createdAt)}
          </p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <p className="mt-3 text-sm text-dim">{s.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="num font-semibold text-warn">{s.suggestedPoints} pts suggested</span>
        {s.awardedPoints != null && <span className="num font-semibold text-success">{signed(s.awardedPoints)} awarded</span>}
        <Evidence href={evidenceHref} />
      </div>
      {s.reviewNote && <p className="mt-3 rounded-md border border-line bg-bg-0/50 p-3 text-sm text-dim">Faculty note: {s.reviewNote}</p>}
      {footer}
    </article>
  );
}

export function DisputeCard({ d, evidenceHref, footer }: { d: Dispute; evidenceHref?: string | null; footer?: React.ReactNode }) {
  const tx = d.transaction;
  return (
    <article className="glass rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight font-bold">{tx ? tx.reason : "Transaction"}</h3>
          <p className="mt-0.5 text-xs text-faint">
            {d.studentName} · {timeAgo(d.createdAt)}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      {tx && (
        <p className="num mt-3 text-sm">
          <span className={tx.amount >= 0 ? "text-success" : "text-danger"}>{signed(tx.amount)}</span> <span className="text-faint">in {tx.categoryName}</span>
        </p>
      )}
      <p className="mt-3 text-sm text-dim">&ldquo;{d.reason}&rdquo;</p>
      <div className="mt-2">
        <Evidence href={evidenceHref} />
      </div>
      {d.resolution && <p className="mt-3 text-sm text-dim">Outcome: <strong className="text-ink capitalize">{d.resolution}</strong></p>}
      {d.reviewNote && <p className="mt-2 rounded-md border border-line bg-bg-0/50 p-3 text-sm text-dim">Faculty note: {d.reviewNote}</p>}
      {footer}
    </article>
  );
}

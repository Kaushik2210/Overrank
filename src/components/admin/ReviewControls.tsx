"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { resolveDisputeAction, reviewSuggestionAction } from "@/lib/actions/feedback";

function useDone() {
  const router = useRouter();
  const { toast } = useToast();
  return (r: { ok: boolean; error?: string }, ok: string) => {
    if (r.ok) toast({ kind: "success", title: ok });
    else toast({ kind: "error", title: "Could not save", body: r.error });
    router.refresh();
  };
}

export function SuggestionReview({ id, suggested }: { id: string; suggested: number }) {
  const [points, setPoints] = useState(String(suggested));
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const done = useDone();
  const go = (decision: "approved" | "rejected") =>
    start(async () => done(await reviewSuggestionAction({ id, decision, points: decision === "approved" ? Number(points) : null, note }), decision === "approved" ? "Approved and points awarded" : "Suggestion rejected"));
  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
        <label className="space-y-1">
          <span className="text-[11px] tracking-wider text-faint uppercase">Award</span>
          <Input type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} aria-label="Points to award" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] tracking-wider text-faint uppercase">Note to student</span>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" maxLength={400} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} onClick={() => go("approved")}>
          <Check className="size-4" /> {Number(points) !== suggested ? "Approve with changes" : "Approve"}
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => go("rejected")}>
          <X className="size-4" /> Reject
        </Button>
      </div>
    </div>
  );
}

export function DisputeReview({ id, currentAmount }: { id: string; currentAmount: number }) {
  const [mode, setMode] = useState<"corrected" | "modified" | "rejected" | null>(null);
  const [amount, setAmount] = useState(String(currentAmount));
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const done = useDone();
  const submit = () =>
    start(async () => {
      if (!mode) return;
      done(await resolveDisputeAction({ id, decision: mode, newAmount: mode === "modified" ? Number(amount) : null, note }), "Dispute resolved");
    });
  const opts = [
    ["corrected", "Approve correction"],
    ["modified", "Modify amount"],
    ["rejected", "Reject"],
  ] as const;
  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div role="radiogroup" aria-label="Resolution" className="flex flex-wrap gap-2">
        {opts.map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`h-11 rounded-md border px-4 text-sm transition-colors ${mode === k ? "border-accent bg-accent/10 text-accent" : "border-line text-dim hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      {mode === "corrected" && <p className="text-xs text-faint">The original entry is reversed. Totals return to what they were before it.</p>}
      {mode === "modified" && (
        <label className="block space-y-1">
          <span className="text-[11px] tracking-wider text-faint uppercase">Corrected points</span>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="max-w-40" />
        </label>
      )}
      {mode && (
        <>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to student (optional)" aria-label="Note to student" maxLength={400} />
          <Button loading={pending} onClick={submit}>
            Confirm
          </Button>
        </>
      )}
    </div>
  );
}

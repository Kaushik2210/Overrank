"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Paperclip, Plus, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { AchievementUnlockModal } from "@/components/gamification/AchievementUnlockModal";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { awardPointsAction, searchStudentsAction, teamMembersAction } from "@/lib/actions/admin";
import { awardSchema } from "@/lib/validators";
import { cn, signed } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { AwardResult, Category, EventItem, Team, UnlockedAchievement } from "@/lib/data/types";

type Pick = { id: string; name: string; teamName: string; teamColor: string; teamId: string; points: number };

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  events: EventItem[];
  teams: Team[];
  prefillStudent?: Pick | null;
};

export function AwardPointsModal({ open, onClose, categories, events, teams, prefillStudent }: Props) {
  const [picked, setPicked] = useState<Pick[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Pick[]>([]);
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [eventId, setEventId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ r: AwardResult; names: string[]; amount: number } | null>(null);
  const [unlock, setUnlock] = useState<UnlockedAchievement | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  // reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setPicked(prefillStudent ? [prefillStudent] : []);
    setQ("");
    setResults([]);
    setSign(1);
    setAmount("10");
    setCategoryId("");
    setEventId("");
    setReason("");
    setErrors({});
    setResult(null);
    setFileName("");
  }, [open, prefillStudent]);

  // debounced student search
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(async () => {
      const r = await searchStudentsAction(q);
      if (r.ok) setResults(r.data);
    }, 180);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const add = (s: Pick) => setPicked((p) => (p.some((x) => x.id === s.id) ? p : [...p, s]));
  const remove = (id: string) => setPicked((p) => p.filter((x) => x.id !== id));

  const addTeam = (teamId: string) =>
    start(async () => {
      const r = await teamMembersAction(teamId);
      if (r.ok) setPicked((p) => [...p, ...r.data.filter((s) => !p.some((x) => x.id === s.id))]);
    });

  const submit = () => {
    const amt = sign * Math.abs(Number(amount));
    const parsed = awardSchema.safeParse({ studentIds: picked.map((p) => p.id), amount: amt, categoryId, reason, eventId: eventId || null });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    start(async () => {
      const fd = new FormData();
      fd.set("studentIds", JSON.stringify(picked.map((p) => p.id)));
      fd.set("amount", String(amt));
      fd.set("categoryId", categoryId);
      fd.set("reason", reason);
      if (eventId) fd.set("eventId", eventId);
      if (file.current?.files?.[0]) fd.set("evidence", file.current.files[0]);
      const r = await awardPointsAction(fd);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast({ kind: "error", title: "Could not award points", body: r.error });
        return;
      }
      setResult({ r: r.data, names: picked.map((p) => p.name), amount: amt });
    });
  };

  const closeAll = () => {
    const first = result?.r.unlocked[0] ?? null;
    onClose();
    if (first) window.setTimeout(() => setUnlock(first), 250);
  };

  return (
    <>
      <Modal open={open} onClose={result ? closeAll : onClose} title={result ? "Points awarded" : "Award points"} description={result ? undefined : "Add or deduct points for one student or a whole group."} className="sm:max-w-xl" bare={!!result}>
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-12 text-center">
              <motion.p
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className={cn("num text-8xl leading-none font-bold", result.amount >= 0 ? "text-success" : "text-danger")}
              >
                <AnimatedCounter value={result.amount} signed duration={0.7} />
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="num mt-6 text-xs tracking-[0.3em] text-faint uppercase">
                Points {result.amount >= 0 ? "awarded" : "deducted"} to
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-1 font-display text-2xl font-bold">
                {result.names.length === 1 ? result.names[0] : `${result.names.length} students`}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass mx-auto mt-6 max-w-xs rounded-lg p-4">
                {result.r.leaderChanged && <p className="num mb-1 text-[11px] font-bold tracking-[0.3em] text-warn">NEW LEADER</p>}
                <p className="text-sm text-dim">{result.r.teamAfter.name} is now</p>
                <p className="num text-3xl font-semibold">
                  #{result.r.teamAfter.rank} <span className="text-base text-faint">with {result.r.teamAfter.points.toLocaleString("en-IN")} pts</span>
                </p>
                {result.r.teamBefore.rank !== result.r.teamAfter.rank && <p className="num mt-1 text-xs text-success">was #{result.r.teamBefore.rank}</p>}
              </motion.div>
              {result.r.unlocked.length > 0 && <p className="mt-4 text-sm text-warn">{result.r.unlocked.length} achievement{result.r.unlocked.length > 1 ? "s" : ""} unlocked</p>}
              <div className="mt-8 flex justify-center gap-3">
                <Button variant="outline" onClick={() => setResult(null)}>
                  Award more
                </Button>
                <Button onClick={closeAll} data-autofocus>
                  Done
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={(e) => (e.preventDefault(), submit())} className="space-y-5 p-5" noValidate>
              <Field label="Students" error={errors.studentIds}>
                {({ id, describedBy }) => (
                  <div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
                      <Input id={id} aria-describedby={describedBy} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID or team" className="pl-10" autoComplete="off" data-autofocus />
                    </div>
                    {results.length > 0 && (
                      <ul className="mt-2 max-h-44 overflow-y-auto rounded-md border border-line bg-bg-2">
                        {results.map((s) => (
                          <li key={s.id}>
                            <button type="button" onClick={() => add(s)} className="flex h-11 w-full items-center gap-3 px-3 text-left text-sm hover:bg-surface-2">
                              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.teamColor }} aria-hidden />
                              <span className="flex-1 truncate">{s.name}</span>
                              <span className="num text-xs text-faint">{s.id}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Users className="size-4 text-faint" aria-hidden />
                      <select aria-label="Add a whole team" onChange={(e) => (e.target.value && addTeam(e.target.value), (e.target.value = ""))} className="h-9 rounded-md border border-line bg-bg-2 px-2 text-xs text-dim" defaultValue="">
                        <option value="">Add a whole team...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {picked.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Selected students">
                        {picked.map((s) => (
                          <motion.li key={s.id} layout transition={spring} className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-1 pl-2.5 text-xs">
                            <span className="size-2 rounded-full" style={{ background: s.teamColor }} aria-hidden />
                            {s.name}
                            <button type="button" onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="grid size-6 place-items-center rounded-full hover:bg-surface-2">
                              <X className="size-3" />
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <Field label="Type">
                  {() => (
                    <div role="radiogroup" aria-label="Award or deduct" className="flex h-11 rounded-md border border-line bg-bg-2 p-1">
                      {([1, -1] as const).map((s) => (
                        <button key={s} type="button" role="radio" aria-checked={sign === s} onClick={() => setSign(s)} className={cn("grid w-12 place-items-center rounded transition-colors", sign === s ? (s === 1 ? "bg-success/20 text-success" : "bg-danger/20 text-danger") : "text-faint")} aria-label={s === 1 ? "Award" : "Deduct"}>
                          {s === 1 ? <Plus className="size-4" /> : <Minus className="size-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Points" error={errors.amount}>
                  {({ id, describedBy, invalid }) => <Input id={id} type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby={describedBy} invalid={invalid} />}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.categoryId}>
                  {({ id, describedBy, invalid }) => (
                    <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-describedby={describedBy} invalid={invalid}>
                      <option value="">Choose...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Event (optional)">
                  {({ id }) => (
                    <Select id={id} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                      <option value="">None</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <Field label="Reason" error={errors.reason}>
                {({ id, describedBy, invalid }) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby={describedBy} invalid={invalid} placeholder="Won the 100m sprint" className="min-h-20" />}
              </Field>

              <Field label="Evidence (optional)">
                {({ id }) => (
                  <label htmlFor={id} className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-line-strong bg-bg-2/50 px-3.5 text-sm text-dim hover:border-accent focus-within:border-accent">
                    <Paperclip className="size-4" aria-hidden />
                    <span className="truncate">{fileName || "Attach a photo or PDF"}</span>
                    <input ref={file} id={id} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
                  </label>
                )}
              </Field>

              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-faint">
                  {picked.length} selected
                  {picked.length > 1 && amount ? ` · ${signed(sign * Math.abs(Number(amount) || 0) * picked.length)} total` : ""}
                </p>
                <Button loading={pending} variant={sign === 1 ? "primary" : "danger"}>
                  {sign === 1 ? "Award points" : "Deduct points"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Modal>
      <AchievementUnlockModal achievement={unlock?.achievement ?? null} open={!!unlock} onClose={() => setUnlock(null)} />
    </>
  );
}

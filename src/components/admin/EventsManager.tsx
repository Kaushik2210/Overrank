"use client";

import { CalendarPlus, Pencil, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { deleteEventAction, saveEventAction, setWinnerAction } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import type { Category, EventItem, Team } from "@/lib/data/types";

const toLocal = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Draft = { id?: string; title: string; description: string; startsAt: string; endsAt: string; points: string; categoryId: string; location: string };

const blank = (cat: string): Draft => {
  const start = new Date(Date.now() + 7 * 86400000);
  start.setMinutes(0, 0, 0);
  return { title: "", description: "", startsAt: toLocal(start.toISOString()), endsAt: toLocal(new Date(+start + 3 * 3600000).toISOString()), points: "50", categoryId: cat, location: "" };
};

export function EventsManager({ events, teams, categories, openNew }: { events: EventItem[]; teams: Team[]; categories: Category[]; openNew?: boolean }) {
  const [draft, setDraft] = useState<Draft | null>(() => (openNew ? blank(categories[0]?.id ?? "") : null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<EventItem | null>(null);
  const [winner, setWinner] = useState<EventItem | null>(null);
  const [winTeam, setWinTeam] = useState("");
  const [award, setAward] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const edit = (e: EventItem) => setDraft({ id: e.id, title: e.title, description: e.description, startsAt: toLocal(e.startsAt), endsAt: toLocal(e.endsAt), points: String(e.points), categoryId: e.categoryId, location: e.location });
  const set = (k: keyof Draft, v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () =>
    start(async () => {
      if (!draft) return;
      const r = await saveEventAction({ ...draft, startsAt: draft.startsAt, endsAt: draft.endsAt });
      if (r.ok) {
        toast({ kind: "success", title: draft.id ? "Event updated" : "Event created" });
        setDraft(null);
        setErrors({});
        router.replace("/admin/events");
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast({ kind: "error", title: "Could not save event", body: r.error });
      }
    });

  const remove = () =>
    start(async () => {
      if (!confirm) return;
      const r = await deleteEventAction(confirm.id);
      if (r.ok) toast({ kind: "success", title: "Event deleted" });
      else toast({ kind: "error", title: "Could not delete", body: r.error });
      setConfirm(null);
      router.refresh();
    });

  const saveWinner = () =>
    start(async () => {
      if (!winner || !winTeam) return;
      const r = await setWinnerAction(winner.id, winTeam, award);
      if (r.ok) toast({ kind: "success", title: "Winner recorded", body: award ? "Points awarded to the team" : undefined });
      else toast({ kind: "error", title: "Could not set winner", body: r.error });
      setWinner(null);
      router.refresh();
    });

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setDraft(blank(categories[0]?.id ?? ""))}>
          <CalendarPlus className="size-4" /> Create event
        </Button>
      </div>

      <ul className="space-y-3">
        {events.map((e) => {
          const w = teams.find((t) => t.id === e.winnerTeamId);
          return (
            <li key={e.id} className="glass flex flex-wrap items-center gap-4 rounded-lg p-4">
              <span className={cn("num rounded-full border px-2.5 py-1 text-[11px] tracking-wider uppercase", e.status === "live" ? "border-success/40 text-success" : e.status === "upcoming" ? "border-accent/40 text-accent" : "border-line text-faint")}>{e.status}</span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-xs text-faint">
                  {dateFmt.format(new Date(e.startsAt))} · {e.location} · {e.points} pts · {e.registeredCount} registered
                  {w && <span style={{ color: w.colorPrimary }}> · Won by {w.name}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status !== "upcoming" && (
                  <Button size="sm" variant="outline" onClick={() => (setWinner(e), setWinTeam(e.winnerTeamId ?? ""), setAward(false))}>
                    <Trophy className="size-4" /> Winner
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => edit(e)} aria-label={`Edit ${e.title}`}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirm(e)} aria-label={`Delete ${e.title}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
        {events.length === 0 && <li className="glass rounded-xl p-10 text-center text-dim">No events yet. Create the first one.</li>}
      </ul>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit event" : "Create event"}>
        {draft && (
          <form onSubmit={(ev) => (ev.preventDefault(), save())} className="space-y-4 p-5" noValidate>
            <Field label="Title" error={errors.title}>
              {({ id, describedBy, invalid }) => <Input id={id} value={draft.title} onChange={(e) => set("title", e.target.value)} aria-describedby={describedBy} invalid={invalid} data-autofocus />}
            </Field>
            <Field label="Description" error={errors.description}>
              {({ id, invalid }) => <Textarea id={id} value={draft.description} onChange={(e) => set("description", e.target.value)} invalid={invalid} className="min-h-20" />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" error={errors.startsAt}>
                {({ id, invalid }) => <Input id={id} type="datetime-local" value={draft.startsAt} onChange={(e) => set("startsAt", e.target.value)} invalid={invalid} />}
              </Field>
              <Field label="Ends" error={errors.endsAt}>
                {({ id, invalid }) => <Input id={id} type="datetime-local" value={draft.endsAt} onChange={(e) => set("endsAt", e.target.value)} invalid={invalid} />}
              </Field>
              <Field label="Points" error={errors.points}>
                {({ id, invalid }) => <Input id={id} type="number" min={0} value={draft.points} onChange={(e) => set("points", e.target.value)} invalid={invalid} />}
              </Field>
              <Field label="Category" error={errors.categoryId}>
                {({ id, invalid }) => (
                  <Select id={id} value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)} invalid={invalid}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Field label="Location" error={errors.location}>
              {({ id, invalid }) => <Input id={id} value={draft.location} onChange={(e) => set("location", e.target.value)} invalid={invalid} />}
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button loading={pending}>{draft.id ? "Save changes" : "Create event"}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this event?" description="Registrations for it are removed too. Points already awarded stay in the ledger.">
        <div className="flex justify-end gap-3 p-5">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={remove}>
            Delete {confirm?.title}
          </Button>
        </div>
      </Modal>

      <Modal open={!!winner} onClose={() => setWinner(null)} title={`Winner: ${winner?.title ?? ""}`} description="Mark the winning team. You can also award the event points to every member.">
        <div className="space-y-4 p-5">
          <Field label="Winning team">
            {({ id }) => (
              <Select id={id} value={winTeam} onChange={(e) => setWinTeam(e.target.value)}>
                <option value="">Choose a team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <label className="flex min-h-11 items-start gap-3 rounded-md border border-line p-3 text-sm">
            <input type="checkbox" checked={award} onChange={(e) => setAward(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
            <span>
              Award {winner?.points} points to <strong>each member</strong> of the winning team
              <span className="block text-xs text-faint">Creates one ledger entry per member and updates the leaderboard.</span>
            </span>
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setWinner(null)}>
              Cancel
            </Button>
            <Button loading={pending} disabled={!winTeam} onClick={saveWinner}>
              Save winner
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

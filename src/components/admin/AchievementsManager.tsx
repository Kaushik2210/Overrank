"use client";

import { Gift, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AchievementBadge, RARITY } from "@/components/gamification/AchievementBadge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { grantAchievementAction, saveAchievementAction, searchStudentsAction } from "@/lib/actions/admin";
import { ICON_NAMES } from "@/lib/icons";
import type { Achievement, AchievementRarity, Category } from "@/lib/data/types";

type Row = Achievement & { unlockedBy: number };
type Draft = { id?: string; name: string; description: string; icon: string; rarity: AchievementRarity; xp: string; kind: "manual" | "points" | "category"; threshold: string; categoryId: string };

const blank = (cat: string): Draft => ({ name: "", description: "", icon: "Award", rarity: "common", xp: "50", kind: "manual", threshold: "100", categoryId: cat });

export function AchievementsManager({ items, categories }: { items: Row[]; categories: Category[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [grant, setGrant] = useState<Row | null>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: string; name: string; teamName: string }[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!grant) return;
    const t = window.setTimeout(async () => {
      const r = await searchStudentsAction(q);
      if (r.ok) setFound(r.data);
    }, 180);
    return () => window.clearTimeout(t);
  }, [q, grant]);

  const edit = (a: Row) =>
    setDraft({
      id: a.id, name: a.name, description: a.description, icon: a.icon, rarity: a.rarity, xp: String(a.xp),
      kind: a.rule.kind, threshold: String("threshold" in a.rule ? a.rule.threshold : 100), categoryId: a.rule.kind === "category" ? a.rule.categoryId : categories[0]?.id ?? "",
    });
  const set = (k: keyof Draft, v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () =>
    start(async () => {
      if (!draft) return;
      const rule = draft.kind === "manual" ? { kind: "manual" } : draft.kind === "points" ? { kind: "points", threshold: draft.threshold } : { kind: "category", categoryId: draft.categoryId, threshold: draft.threshold };
      const r = await saveAchievementAction({ id: draft.id, name: draft.name, description: draft.description, icon: draft.icon, rarity: draft.rarity, xp: draft.xp, rule });
      if (r.ok) {
        toast({ kind: "success", title: "Achievement saved" });
        setDraft(null);
        setErrors({});
        router.refresh();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast({ kind: "error", title: "Could not save", body: r.error });
      }
    });

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setDraft(blank(categories[0]?.id ?? ""))}>
          <Plus className="size-4" /> New achievement
        </Button>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((a) => (
          <li key={a.id} className="glass flex items-center gap-4 rounded-lg p-4">
            <AchievementBadge icon={a.icon} rarity={a.rarity} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.name}</p>
              <p className="truncate text-xs text-faint">
                <span style={{ color: RARITY[a.rarity].color }}>{RARITY[a.rarity].label}</span> · {a.rule.kind === "manual" ? "Manual" : a.rule.kind === "points" ? `${a.rule.threshold} pts` : `${a.rule.threshold} in category`} · {a.unlockedBy} unlocked
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => (setGrant(a), setQ(""))} aria-label={`Grant ${a.name}`}>
              <Gift className="size-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => edit(a)} aria-label={`Edit ${a.name}`}>
              <Pencil className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit achievement" : "New achievement"}>
        {draft && (
          <form onSubmit={(e) => (e.preventDefault(), save())} className="space-y-4 p-5" noValidate>
            <Field label="Name" error={errors.name}>
              {({ id, invalid }) => <Input id={id} value={draft.name} onChange={(e) => set("name", e.target.value)} invalid={invalid} data-autofocus />}
            </Field>
            <Field label="Description" error={errors.description}>
              {({ id, invalid }) => <Input id={id} value={draft.description} onChange={(e) => set("description", e.target.value)} invalid={invalid} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Icon">
                {({ id }) => (
                  <Select id={id} value={draft.icon} onChange={(e) => set("icon", e.target.value)}>
                    {ICON_NAMES.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Rarity">
                {({ id }) => (
                  <Select id={id} value={draft.rarity} onChange={(e) => set("rarity", e.target.value)}>
                    {(Object.keys(RARITY) as AchievementRarity[]).map((r) => (
                      <option key={r} value={r}>
                        {RARITY[r].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="XP reward" error={errors.xp}>
                {({ id, invalid }) => <Input id={id} type="number" min={0} value={draft.xp} onChange={(e) => set("xp", e.target.value)} invalid={invalid} />}
              </Field>
            </div>
            <Field label="Unlock rule">
              {({ id }) => (
                <Select id={id} value={draft.kind} onChange={(e) => set("kind", e.target.value)}>
                  <option value="manual">Manual (faculty grants it)</option>
                  <option value="points">Automatic: total points</option>
                  <option value="category">Automatic: points in a category</option>
                </Select>
              )}
            </Field>
            {draft.kind !== "manual" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {draft.kind === "category" && (
                  <Field label="Category">
                    {({ id }) => (
                      <Select id={id} value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
                <Field label="Threshold (points)" error={errors.rule}>
                  {({ id }) => <Input id={id} type="number" min={1} value={draft.threshold} onChange={(e) => set("threshold", e.target.value)} />}
                </Field>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button loading={pending}>Save</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!grant} onClose={() => setGrant(null)} title={`Grant ${grant?.name ?? ""}`} description="Search for the student who earned it.">
        <div className="space-y-3 p-5">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID or team" aria-label="Search students" data-autofocus />
          <ul className="max-h-64 overflow-y-auto rounded-md border border-line">
            {found.map((s) => (
              <li key={s.id}>
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!grant) return;
                      const r = await grantAchievementAction(grant.id, s.id);
                      toast(r.ok ? { kind: "success", title: `Granted to ${s.name}` } : { kind: "error", title: "Could not grant", body: r.error });
                      setGrant(null);
                      router.refresh();
                    })
                  }
                  className="flex h-11 w-full items-center justify-between px-3 text-left text-sm hover:bg-surface-2"
                >
                  {s.name} <span className="num text-xs text-faint">{s.teamName}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}

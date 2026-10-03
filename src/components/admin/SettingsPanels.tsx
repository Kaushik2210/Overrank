"use client";

import { FileUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Panel } from "./bits";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { commitRosterAction, createCategoryAction, previewRosterAction, updateTeamAction, updateXpSettingsAction } from "@/lib/actions/admin";
import { parseRosterCsv } from "@/lib/csv";
import { ICON_NAMES } from "@/lib/icons";
import { levelFromPoints } from "@/lib/xp";
import type { Category, RosterPreview, RosterRow, Team, XpSettings } from "@/lib/data/types";

function useSave() {
  const router = useRouter();
  const { toast } = useToast();
  return (r: { ok: boolean; error?: string; fieldErrors?: Record<string, string> }, msg: string) => {
    toast(r.ok ? { kind: "success", title: msg } : { kind: "error", title: "Could not save", body: r.error });
    if (r.ok) router.refresh();
    return r;
  };
}

function TeamRow({ team }: { team: Team }) {
  const [v, setV] = useState({ name: team.name, motto: team.motto, colorPrimary: team.colorPrimary, colorGlow: team.colorGlow });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const saved = useSave();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setErrors((await saved(await updateTeamAction({ id: team.id, ...v }), `${v.name} updated`)).fieldErrors ?? {}));
      }}
      className="grid gap-3 border-b border-line p-4 last:border-0 md:grid-cols-[1fr_1.4fr_auto_auto_auto]"
    >
      <Field label="Name" error={errors.name}>{({ id, invalid }) => <Input id={id} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} invalid={invalid} />}</Field>
      <Field label="Motto" error={errors.motto}>{({ id, invalid }) => <Input id={id} value={v.motto} onChange={(e) => setV({ ...v, motto: e.target.value })} invalid={invalid} />}</Field>
      <Field label="Primary" error={errors.colorPrimary}>
        {({ id }) => (
          <div className="flex h-11 items-center gap-2">
            <input id={id} type="color" value={v.colorPrimary} onChange={(e) => setV({ ...v, colorPrimary: e.target.value })} className="size-11 cursor-pointer rounded border border-line bg-transparent p-1" />
            <span className="num text-xs text-faint">{v.colorPrimary}</span>
          </div>
        )}
      </Field>
      <Field label="Glow" error={errors.colorGlow}>
        {({ id }) => (
          <div className="flex h-11 items-center gap-2">
            <input id={id} type="color" value={v.colorGlow} onChange={(e) => setV({ ...v, colorGlow: e.target.value })} className="size-11 cursor-pointer rounded border border-line bg-transparent p-1" />
            <span className="num text-xs text-faint">{v.colorGlow}</span>
          </div>
        )}
      </Field>
      <div className="flex items-end">
        <Button loading={pending} variant="outline">
          Save
        </Button>
      </div>
    </form>
  );
}

export function TeamsPanel({ teams }: { teams: Team[] }) {
  return (
    <Panel title="Teams">
      {teams.map((t) => (
        <TeamRow key={t.id} team={t} />
      ))}
    </Panel>
  );
}

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Shapes");
  const [color, setColor] = useState("#d4ff3a");
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();
  const saved = useSave();
  return (
    <Panel title="Point categories">
      <ul className="flex flex-wrap gap-2 p-3">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm">
            <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
            {c.name}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-3 border-t border-line p-4 sm:grid-cols-[1fr_9rem_auto_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saved(await createCategoryAction({ name, icon, color }), "Category added");
            setErr(r.ok ? undefined : r.fieldErrors?.name ?? r.error);
            if (r.ok) setName("");
          });
        }}
      >
        <Field label="New category" error={err}>{({ id, invalid }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cultural" invalid={invalid} />}</Field>
        <Field label="Icon">{({ id }) => <Select id={id} value={icon} onChange={(e) => setIcon(e.target.value)}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
        <Field label="Colour">{({ id }) => <input id={id} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-11 cursor-pointer rounded border border-line bg-transparent p-1" />}</Field>
        <div className="flex items-end">
          <Button loading={pending} variant="outline">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function XpPanel({ xp }: { xp: XpSettings }) {
  const [per, setPer] = useState(String(xp.xpPerPoint));
  const [th, setTh] = useState(xp.thresholds.join(", "));
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();
  const saved = useSave();
  const parsed = th.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
  const preview = [0, 50, 150, 500, 1000].map((p) => `${p} pts → L${levelFromPoints(p, { xpPerPoint: Number(per) || 1, thresholds: parsed.length ? parsed : xp.thresholds }).level}`).join("   ");
  return (
    <Panel title="XP and levels">
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saved(await updateXpSettingsAction({ xpPerPoint: Number(per), thresholds: parsed }), "XP settings saved");
            setErr(r.ok ? undefined : r.fieldErrors?.thresholds ?? r.error);
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="XP per point">{({ id }) => <Input id={id} type="number" step="0.1" min="0.1" value={per} onChange={(e) => setPer(e.target.value)} />}</Field>
          <Field label="Cumulative XP to reach levels 2, 3, 4..." error={err} hint="Comma separated, increasing. Past the last value the final gap repeats.">
            {({ id, invalid }) => <Input id={id} value={th} onChange={(e) => setTh(e.target.value)} invalid={invalid} />}
          </Field>
        </div>
        <p className="num text-xs text-faint">{preview}</p>
        <Button loading={pending} variant="outline">
          Save formula
        </Button>
      </form>
    </Panel>
  );
}

export function RosterPanel() {
  const [preview, setPreview] = useState<RosterPreview | null>(null);
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [msg, setMsg] = useState<string>();
  const [codes, setCodes] = useState<{ studentId: string; name: string; code: string }[]>([]);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const saved = useSave();

  const onFile = async (f: File | undefined) => {
    setPreview(null);
    setMsg(undefined);
    if (!f) return;
    if (f.size > 1024 * 1024) return setMsg("File is larger than 1 MB");
    const { rows, error } = parseRosterCsv(await f.text());
    if (error) return setMsg(error);
    setRows(rows);
    start(async () => {
      const r = await previewRosterAction(rows);
      if (r.ok) setPreview(r.data);
      else setMsg(r.error);
    });
  };

  return (
    <Panel title="Import roster (CSV)">
      <div className="space-y-4 p-4">
        <p className="text-sm text-dim">
          Columns: <code className="num rounded bg-surface-2 px-1.5 py-0.5 text-xs">team,studentId,name</code>. Existing student IDs are updated, new ones are added. Nothing is saved until you confirm.
        </p>
        <label className="flex h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-line-strong px-4 text-sm text-dim hover:border-accent hover:text-ink focus-within:border-accent">
          <FileUp className="size-4" aria-hidden /> Choose CSV file
          <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
        {codes.length > 0 && (
          <div className="rounded-md border border-warn/30 bg-warn/10 p-3 text-sm">
            <p className="text-warn">These one-time login codes are shown once. Download them now and hand them to the students.</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => {
                const csv = ["studentId,name,code", ...codes.map((c) => `${c.studentId},"${c.name.replace(/"/g, '""')}",${c.code}`)].join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                a.download = "housecore-login-codes.csv";
                a.click();
                URL.revokeObjectURL(a.href);
                setCodes([]);
              }}
            >
              Download login codes
            </Button>
          </div>
        )}
        {preview && (
          <div className="space-y-3">
            <p className="num text-sm">
              <span className="text-success">{preview.adds} new</span> · <span className="text-accent">{preview.updates} updates</span> · <span className={preview.issues.length ? "text-danger" : "text-faint"}>{preview.issues.length} problems</span>
            </p>
            {preview.issues.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {preview.issues.map((i) => (
                  <li key={i.row}>Row {i.row}: {i.message}</li>
                ))}
              </ul>
            )}
            <Button
              loading={pending}
              disabled={preview.issues.length > 0 || preview.valid.length === 0}
              onClick={() =>
                start(async () => {
                  const r = await saved(await commitRosterAction(rows), "Roster imported");
                  if (r.ok) {
                    setPreview(null);
                    setRows([]);
                    if (file.current) file.current.value = "";
                    const c = (r as { data?: { codes?: typeof codes } }).data?.codes;
                    if (c?.length) setCodes(c);
                  }
                })
              }
            >
              Import {preview.valid.length} students
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

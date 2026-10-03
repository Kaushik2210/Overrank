"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { applyPrefs, readPrefs, usePrefs, writePrefs, type Prefs } from "@/lib/prefs";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const MOTION: { id: Prefs["motion"]; label: string; hint: string }[] = [
  { id: "system", label: "Follow my device", hint: "Uses your operating system setting." },
  { id: "reduce", label: "Reduce motion", hint: "Fades only. No sliding, scaling or background movement." },
  { id: "full", label: "Full motion", hint: "Everything animates." },
];

export function SettingsForm() {
  const p = usePrefs();
  const update = (next: Prefs) => writePrefs(next);
  return (
    <div className="space-y-6">
      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-lg font-bold">Sound effects</h2>
        <p className="mt-1 text-sm text-dim">Short tones when points land or ranks change. Off by default and never plays on page load.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button role="switch" aria-checked={p.sound} onClick={() => update({ ...p, sound: !p.sound })} className={cn("relative h-8 w-14 rounded-full border transition-colors", p.sound ? "border-accent bg-accent/30" : "border-line bg-surface-2")}>
            <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-[left]", p.sound ? "left-8" : "left-1")} />
            <span className="sr-only">Sound effects</span>
          </button>
          <span className="flex items-center gap-2 text-sm">{p.sound ? <Volume2 className="size-4 text-accent" /> : <VolumeX className="size-4 text-faint" />} {p.sound ? "On" : "Off"}</span>
          <Button variant="outline" size="sm" disabled={!p.sound} onClick={() => playSound("award")}>
            Test sound
          </Button>
        </div>
      </section>

      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-lg font-bold">Motion</h2>
        <div role="radiogroup" aria-label="Motion" className="mt-4 space-y-2">
          {MOTION.map((m) => (
            <button key={m.id} role="radio" aria-checked={p.motion === m.id} onClick={() => update({ ...p, motion: m.id })} className={cn("flex min-h-14 w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors", p.motion === m.id ? "border-accent bg-accent/[0.06]" : "border-line hover:bg-surface")}>
              <span className={cn("mt-1 size-4 shrink-0 rounded-full border-2", p.motion === m.id ? "border-accent bg-accent" : "border-line-strong")} aria-hidden />
              <span>
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-faint">{m.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <p className="text-xs text-faint">OVERRANK is designed dark-first. These preferences are saved in this browser only.</p>
    </div>
  );
}

/** Applies saved preferences on every page. Rendered once from Providers. */
export function PrefsApplier() {
  useEffect(() => applyPrefs(readPrefs()), []);
  return null;
}

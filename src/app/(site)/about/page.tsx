import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "About" };

const RULES = [
  ["Points are earned, not given", "Faculty award points after verifying an achievement, and every award carries a reason."],
  ["Everything is on the record", "Each point lives in an append-only ledger. Corrections add a new entry instead of erasing history."],
  ["Open to everyone", "The leaderboard, team pages and player profiles are public. Only faculty sign in, and only faculty can award or change points."],
  ["Mistakes get fixed, not hidden", "A wrong entry is reversed with a new compensating entry, so the history is never rewritten, and every faculty action is logged."],
];

export default async function AboutPage() {
  const settings = await getRepo().getSettings();
  const xp = settings.xp;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="About" title="How HOUSECORE works" description="A season-long competition between houses. Here is the short version of the rules." className="mb-12" />
      <div className="grid gap-4 sm:grid-cols-2">
        {RULES.map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.05} className="glass rounded-lg p-6">
            <h2 className="font-display text-lg font-bold">{t}</h2>
            <p className="mt-2 text-dim">{d}</p>
          </Reveal>
        ))}
      </div>
      <Reveal className="glass mt-8 rounded-lg p-6">
        <h2 className="font-display text-lg font-bold">XP and levels</h2>
        <p className="mt-2 text-dim">
          You earn {xp.xpPerPoint} XP for every point. Level 2 starts at {xp.thresholds[0]} XP, level 3 at {xp.thresholds[1]} XP, and the gaps keep growing from there.
        </p>
      </Reveal>
    </div>
  );
}

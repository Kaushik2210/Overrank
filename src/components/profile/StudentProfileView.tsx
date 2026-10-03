import { Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { BarsChart } from "@/components/charts/LazyCharts";
import { AchievementBadge, RARITY } from "@/components/gamification/AchievementBadge";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { AnimatedProgressBar } from "@/components/gamification/AnimatedProgressBar";
import { ProgressRing } from "@/components/gamification/ProgressRing";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { TransactionCard } from "@/components/points/TransactionCard";
import { Reveal } from "@/components/ui/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/ui/Stagger";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import type { StudentDetail } from "@/lib/data/types";

type Props = {
  detail: StudentDetail;
  totalStudents: number;
  /** Where a transaction card should link. Omit to render cards unlinked. */
  txHref?: (id: string) => string;
  children?: React.ReactNode;
};

export function StudentProfileView({ detail, totalStudents, txHref, children }: Props) {
  const { student: s } = detail;
  const unlocked = detail.achievements.filter((a) => a.unlockedAt);
  const sorted = [...detail.achievements].sort((a, b) => Number(!!b.unlockedAt) - Number(!!a.unlockedAt));
  const percentile = totalStudents > 1 ? 1 - (s.rank - 1) / (totalStudents - 1) : 1;
  const color = s.teamColor;

  return (
    <div style={teamVars({ colorPrimary: s.teamColor, colorGlow: s.teamGlow })}>
      <section className="noise relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at 20% -20%, color-mix(in srgb, var(--team-primary) 35%, transparent), transparent 60%)" }} />
        <div aria-hidden className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <StudentAvatar name={s.name} color={s.teamColor} glow={s.teamGlow} size={96} />
              <div>
                <p className="num text-xs tracking-[0.25em] text-faint uppercase">Player {s.id}</p>
                <h1 className="mt-1 font-display text-3xl leading-tight font-bold sm:text-5xl">{s.name}</h1>
                <Link href={`/teams/${s.teamSlug}`} className="mt-1 inline-block text-sm font-medium" style={{ color: "var(--team-glow)" }}>
                  {s.teamName}
                </Link>
              </div>
            </div>

            <div className="glass flex-1 rounded-xl p-5 md:max-w-md md:justify-self-end">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.25em] text-faint uppercase">Level</p>
                  <p className="num text-5xl leading-none font-bold" style={{ color: "var(--team-glow)" }}>
                    {s.level}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-2xl font-semibold">
                    <AnimatedCounter value={s.xp} /> <span className="text-sm text-faint">XP</span>
                  </p>
                  <p className="text-xs text-dim">{s.xpToNext} XP to level {s.level + 1}</p>
                </div>
              </div>
              <AnimatedProgressBar value={s.levelProgress} label={`Progress to level ${s.level + 1}`} height={10} className="mt-4" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
        {children}

        <Reveal>
          <StaggerGroup className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StaggerItem>
              <div className="glass flex h-full flex-col items-center rounded-lg p-5 text-center">
                <ProgressRing value={s.levelProgress} label={`${Math.round(s.levelProgress * 100)}%`} caption="to next" aria-label="Progress to next level" />
                <p className="mt-3 text-sm font-medium">Level progress</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass flex h-full flex-col items-center rounded-lg p-5 text-center">
                <ProgressRing value={s.teamContribution} label={`${Math.round(s.teamContribution * 100)}%`} caption="of team" aria-label="Share of team points" />
                <p className="mt-3 text-sm font-medium">Team contribution</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass flex h-full flex-col items-center rounded-lg p-5 text-center">
                <ProgressRing value={detail.achievements.length ? unlocked.length / detail.achievements.length : 0} label={`${unlocked.length}/${detail.achievements.length}`} caption="badges" aria-label="Badges unlocked" />
                <p className="mt-3 text-sm font-medium">Achievements</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass flex h-full flex-col items-center rounded-lg p-5 text-center">
                <ProgressRing value={percentile} label={`#${s.rank}`} caption={`of ${totalStudents}`} aria-label="Overall rank" />
                <p className="mt-3 text-sm font-medium">
                  Overall rank <span className="text-faint">(#{s.teamRank} in team)</span>
                </p>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass rounded-lg p-5">
            <p className="flex items-center gap-2 text-xs tracking-wider text-faint uppercase">
              <Trophy className="size-4" aria-hidden /> Total points
            </p>
            <p className="mt-2 text-5xl font-semibold" style={{ color: "var(--team-glow)" }}>
              <AnimatedCounter value={s.points} />
            </p>
          </div>
          <div className="md:col-span-2">
            {detail.categoryBreakdown.length > 0 ? (
              <BarsChart title="Where your points come from" data={detail.categoryBreakdown.slice(0, 6).map((c) => ({ name: c.name, value: c.points, color: c.color }))} layout="vertical" height={Math.max(160, detail.categoryBreakdown.slice(0, 6).length * 36 + 40)} />
            ) : (
              <div className="glass grid h-full place-items-center rounded-lg p-6 text-center text-dim">
                <div>
                  <Flame className="mx-auto mb-2 size-6 text-faint" aria-hidden />
                  No points yet. The first award starts your journey.
                </div>
              </div>
            )}
          </div>
        </div>

        <Reveal>
          <h2 className="mb-5 font-display text-2xl font-bold">Achievements</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sorted.map((a) => (
              <div key={a.id} title={a.description} className={cn("glass flex flex-col items-center rounded-lg p-4 text-center", !a.unlockedAt && "opacity-60")}>
                <AchievementBadge icon={a.icon} rarity={a.rarity} locked={!a.unlockedAt} size={60} />
                <p className="mt-2 text-sm font-medium">{a.name}</p>
                <p className="text-[10px] tracking-wider uppercase" style={{ color: a.unlockedAt ? RARITY[a.rarity].color : undefined }}>
                  {a.unlockedAt ? RARITY[a.rarity].label : "Locked"}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mb-5 font-display text-2xl font-bold">Point history</h2>
          {detail.transactions.length === 0 ? (
            <p className="glass rounded-lg p-6 text-dim">Nothing here yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {detail.transactions.slice(0, 20).map((tx) => (
                <TransactionCard key={tx.id} tx={tx} showStudent={false} href={txHref?.(tx.id)} />
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}

import { Award, CalendarCheck, Crown, Star, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarsChart, TrendChart } from "@/components/charts/LazyCharts";
import { AchievementBadge, RARITY } from "@/components/gamification/AchievementBadge";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { AnimatedProgressBar } from "@/components/gamification/AnimatedProgressBar";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { RankDelta } from "@/components/leaderboard/RankDelta";
import { TeamLogo } from "@/components/leaderboard/TeamLogo";
import { TransactionCard } from "@/components/points/TransactionCard";
import { Reveal } from "@/components/ui/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/ui/Stagger";
import { Timeline } from "@/components/ui/Timeline";
import { getRepo } from "@/lib/data";
import { teamVars } from "@/lib/team-style";
import { formatPoints } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getRepo().getTeam(slug);
  return { title: d?.team.name ?? "Team" };
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function Heading({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2.5 font-display text-2xl font-bold">
      {icon}
      {children}
    </h2>
  );
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const d = await getRepo().getTeam(slug);
  if (!d) notFound();
  const { team: t } = d;

  return (
    <div style={teamVars(t)}>
      {/* hero */}
      <section className="noise relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--team-primary) 38%, transparent), transparent 65%)" }} />
        <div aria-hidden className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 sm:py-20 md:flex-row md:text-left">
          <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={140} />
          <div className="flex-1">
            <p className="num inline-flex items-center gap-3 text-xs tracking-[0.28em] text-faint uppercase">
              Rank #{t.rank} <RankDelta rank={t.rank} previous={t.previousRank} />
            </p>
            <h1 className="mt-2 font-display text-5xl leading-none font-bold sm:text-7xl">{t.name}</h1>
            <p className="mt-3 text-lg text-dim">{t.motto}</p>
          </div>
          <div className="glass rounded-xl px-8 py-6 text-center">
            <div className="text-5xl font-semibold sm:text-6xl" style={{ color: "var(--team-glow)" }}>
              <AnimatedCounter value={t.points} />
            </div>
            <p className="mt-1 text-[11px] tracking-[0.25em] text-faint uppercase">team points</p>
            <p className="num mt-3 inline-flex items-center gap-1.5 text-sm text-success">
              <TrendingUp className="size-4" aria-hidden />
              {t.weeklyGrowth > 0 ? "+" : ""}
              {t.weeklyGrowth} this week
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
        {/* top contributors */}
        <Reveal>
          <Heading icon={<Crown className="size-6 text-warn" aria-hidden />}>Top contributors</Heading>
          {d.topContributors.length === 0 ? (
            <p className="glass rounded-lg p-6 text-dim">No points on the board yet. The first award will show up here.</p>
          ) : (
            <StaggerGroup className="grid gap-3 md:grid-cols-3">
              {d.topContributors.slice(0, 3).map((m, i) => (
                <StaggerItem key={m.id}>
                  <Link href={`/students/${m.id}`} className="glass block rounded-lg p-5 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={m.name} color={t.colorPrimary} glow={t.colorGlow} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{m.name}</p>
                        <p className="text-xs text-faint">Level {m.level}</p>
                      </div>
                      <span className="num text-2xl font-bold text-faint">{i + 1}</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="num text-2xl font-semibold" style={{ color: "var(--team-glow)" }}>
                        {formatPoints(m.points)}
                      </span>
                      <span className="text-xs text-faint">{Math.round(m.teamContribution * 100)}% of team</span>
                    </div>
                    <AnimatedProgressBar value={m.teamContribution} label={`${m.name} share of team points`} className="mt-2" height={6} />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Reveal>

        {/* charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart title="Points over eight weeks" subtitle="Cumulative team total" data={d.weekly} xKey="week" series={[{ key: "total", name: "Total", color: t.colorPrimary }]} area />
          <BarsChart title="Category performance" subtitle="Where this team earns its points" data={d.categoryPerformance.slice(0, 8).map((c) => ({ name: c.name, value: c.points, color: c.color }))} layout="vertical" />
        </div>

        {/* members */}
        <Reveal>
          <Heading icon={<Users className="size-6 text-accent" aria-hidden />}>Members</Heading>
          <StaggerGroup gap={0.04} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.members.map((m) => (
              <StaggerItem key={m.id}>
                <Link href={`/students/${m.id}`} className="glass flex items-center gap-3 rounded-lg p-3.5 transition-colors hover:border-line-strong">
                  <StudentAvatar name={m.name} color={t.colorPrimary} glow={t.colorGlow} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="num text-xs text-faint">
                      {m.id} · Lv {m.level}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold">{formatPoints(m.points)}</span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Reveal>

        {/* achievements */}
        {d.achievements.length > 0 && (
          <Reveal>
            <Heading icon={<Award className="size-6 text-accent" aria-hidden />}>Team achievements</Heading>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {d.achievements.slice(0, 12).map(({ achievement: a, count }) => (
                <div key={a.id} className="glass flex flex-col items-center rounded-lg p-4 text-center">
                  <AchievementBadge icon={a.icon} rarity={a.rarity} size={60} />
                  <p className="mt-2 text-sm font-medium">{a.name}</p>
                  <p className="text-[10px] tracking-wider uppercase" style={{ color: RARITY[a.rarity].color }}>
                    {RARITY[a.rarity].label}
                  </p>
                  <p className="num mt-1 text-xs text-faint">x{count}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          {/* events won */}
          <Reveal>
            <Heading icon={<CalendarCheck className="size-6 text-accent" aria-hidden />}>Events won</Heading>
            {d.eventsWon.length === 0 ? (
              <p className="glass rounded-lg p-6 text-dim">No event wins yet.</p>
            ) : (
              <ul className="space-y-3">
                {d.eventsWon.map((e) => (
                  <li key={e.id} className="glass flex items-center justify-between gap-3 rounded-lg p-4">
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-faint">
                        {e.categoryName} · {dateFmt.format(new Date(e.startsAt))}
                      </p>
                    </div>
                    <span className="num text-sm font-semibold text-warn">{e.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          {/* timeline */}
          <Reveal>
            <Heading icon={<Star className="size-6 text-accent" aria-hidden />}>Team timeline</Heading>
            {d.timeline.length === 0 ? (
              <p className="glass rounded-lg p-6 text-dim">The story starts with the first award.</p>
            ) : (
              <Timeline
                items={d.timeline.slice(0, 8).map((e, i) => ({
                  id: `${e.at}-${i}`,
                  title: e.title,
                  detail: e.detail,
                  at: dateFmt.format(new Date(e.at)),
                  tone: e.kind === "event" ? "success" : "default",
                }))}
              />
            )}
          </Reveal>
        </div>

        {/* history */}
        <Reveal>
          <Heading>Recent point history</Heading>
          {d.history.length === 0 ? (
            <p className="glass rounded-lg p-6 text-dim">No transactions yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {d.history.slice(0, 10).map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}

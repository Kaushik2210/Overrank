import { ArrowRight, ClipboardCheck, Medal, Swords, TrendingUp } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { AchievementBadge, RARITY } from "@/components/gamification/AchievementBadge";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { Marquee } from "@/components/fx/Marquee";
import { Hero } from "@/components/landing/Hero";
import { Section } from "@/components/landing/Section";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { SeasonRace } from "@/components/leaderboard/SeasonRace";
import { TeamLogo } from "@/components/leaderboard/TeamLogo";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/ui/Stagger";
import { getRepo } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { teamVars } from "@/lib/team-style";
import { formatPoints } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Swords, t: "Compete", d: "Join events, sports, hackathons and volunteering drives for your house." },
  { icon: ClipboardCheck, t: "Get verified", d: "Faculty verify the result and attach evidence to every award." },
  { icon: TrendingUp, t: "Points land", d: "The ledger updates and the leaderboard re-ranks in real time." },
  { icon: Medal, t: "Level up", d: "Earn XP, unlock badges and push your team toward the trophy." },
];

export default async function Landing() {
  const repo = getRepo();
  const [teams, students, categories, events, achievements, overview, analytics, latest] = await Promise.all([
    repo.getTeams(),
    repo.getStudents(),
    repo.getCategories(),
    repo.listEvents(),
    repo.listAchievements(),
    repo.getOverview(),
    repo.getAnalytics(),
    repo.listTransactions({ pageSize: 12 }),
  ]);
  const performers = [...students].sort((a, b) => b.points - a.points).slice(0, 5);
  const upcoming = events.filter((e) => e.status !== "past").slice(0, 3);
  const recent = [...achievements].sort((a, b) => b.unlockedBy - a.unlockedBy).slice(0, 6);

  return (
    <>
      <Hero
        stats={[
          { label: "Students", value: overview.students },
          { label: "Teams", value: overview.teams },
          { label: "Points awarded", value: overview.pointsAwarded },
          { label: "Active events", value: overview.activeEvents },
        ]}
      />

      {latest.rows.length > 0 && (
        <div className="border-y border-line bg-bg-1/80 py-3.5" aria-label="Latest results">
          <Marquee speed={55}>
            {latest.rows.map((t) => (
              <span key={t.id} className="num inline-flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="size-2 rounded-full" style={{ background: t.teamColor }} aria-hidden />
                <span className={t.amount >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                <span className="text-ink">{t.studentName}</span>
                <span className="text-faint">{t.categoryName}</span>
              </span>
            ))}
          </Marquee>
        </div>
      )}

      <Section
        eyebrow="Live leaderboard"
        title="Who is on top right now"
        action={
          <Button href="/leaderboard" variant="outline">
            Full standings <ArrowRight className="size-4" />
          </Button>
        }
      >
        <LeaderboardView initial={teams} live={false} />
      </Section>

      <Section eyebrow="Season replay" title="Watch the race unfold" description="Press play, or drag the slider to scrub week by week and see who overtook whom.">
        <SeasonRace teams={teams} series={analytics.pointsOverTime} />
      </Section>

      <Section
        id="how-points-work"
        eyebrow="How points work"
        title="Twelve ways to move your team up"
        description="Points are awarded by faculty across every part of campus life. Deductions exist too, so consistency matters."
        tint
      >
        <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <StaggerItem key={c.id}>
              <div className="glass flex h-full items-center gap-3 rounded-lg p-4 transition-transform duration-300 hover:-translate-y-1">
                <span className="grid size-10 shrink-0 place-items-center rounded-md" style={{ background: `${c.color}22`, color: c.color }}>
                  <Icon name={c.icon} className="size-5" />
                </span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section eyebrow="The houses" title="Six teams. One trophy." action={<Button href="/teams" variant="outline">Meet the teams</Button>}>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <StaggerItem key={t.id}>
              <Link
                href={`/teams/${t.slug}`}
                style={teamVars(t)}
                className="glass group relative flex items-center gap-4 overflow-hidden rounded-lg p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--team-primary)_55%,transparent),0_0_40px_-10px_var(--team-primary)]"
              >
                <div aria-hidden className="absolute -right-10 -bottom-10 size-36 rounded-full opacity-25 blur-2xl" style={{ background: "var(--team-primary)" }} />
                <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={64} />
                <div className="relative">
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  <p className="text-sm text-dim">{t.motto}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section eyebrow="Top performers" title="Individual standouts" tint>
        <StaggerGroup gap={0.08} className="mx-auto max-w-3xl space-y-3">
          {performers.map((s, i) => (
            <StaggerItem key={s.id}>
              <Link
                href={`/students/${s.id}`}
                style={teamVars({ colorPrimary: s.teamColor, colorGlow: s.teamGlow })}
                className="glass flex items-center gap-4 rounded-lg p-4 transition-colors hover:border-line-strong"
              >
                <span className="num w-6 text-center text-lg font-bold text-faint">{i + 1}</span>
                <StudentAvatar name={s.name} color={s.teamColor} glow={s.teamGlow} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--team-glow)" }}>
                    {s.teamName} · Level {s.level}
                  </p>
                </div>
                <p className="num text-xl font-semibold">
                  {formatPoints(s.points)}
                  <span className="ml-1 text-xs text-faint">pts</span>
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section eyebrow="Achievements" title="Badges worth chasing" action={<Button href="/achievements" variant="outline">All badges</Button>}>
        <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {recent.map((a) => (
            <StaggerItem key={a.id}>
              <div className="glass flex h-full flex-col items-center rounded-lg p-4 text-center">
                <AchievementBadge icon={a.icon} rarity={a.rarity} size={72} />
                <p className="mt-3 text-sm font-semibold">{a.name}</p>
                <p className="mt-0.5 text-[11px] tracking-wider uppercase" style={{ color: RARITY[a.rarity].color }}>
                  {RARITY[a.rarity].label}
                </p>
                <p className="mt-2 text-xs text-faint">{a.unlockedBy} unlocked</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section eyebrow="Upcoming events" title="Next on the calendar" description="Show up, compete, and bring points home." action={<Button href="/events" variant="outline">All events</Button>} tint>
        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          {upcoming.map((e) => (
            <StaggerItem key={e.id} className="h-full">
              <EventCard event={e} teams={teams} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section eyebrow="How it works" title="From effort to leaderboard in four steps">
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StaggerItem key={s.t}>
              <div className="glass relative h-full rounded-lg p-5">
                <span className="num absolute top-4 right-4 text-3xl font-bold text-white/[0.06]">0{i + 1}</span>
                <s.icon className="size-6 text-accent" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-dim">{s.d}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <section className="relative overflow-hidden border-t border-line py-20 sm:py-28">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgb(212_255_58/0.14),transparent_60%)]" />
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl leading-tight font-bold sm:text-6xl">COMPETE. CONTRIBUTE. CLIMB.</h2>
          <p className="mt-4 text-lg text-dim">Your house is counting on you.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/leaderboard" size="lg">
              VIEW LEADERBOARD
            </Button>
            <Button href="/teams" size="lg" variant="outline">
              MEET THE TEAMS
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}

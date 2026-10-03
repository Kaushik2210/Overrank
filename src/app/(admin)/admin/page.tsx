import { CalendarDays, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { AdminHeader, Panel, StatCard } from "@/components/admin/bits";
import { QuickAward } from "@/components/admin/QuickAward";
import { TrendChart } from "@/components/charts/LazyCharts";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { TransactionCard } from "@/components/points/TransactionCard";
import { getRepo } from "@/lib/data";
import { formatPoints, timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  const repo = getRepo();
  const [overview, teams, students, analytics, ledger, audit] = await Promise.all([
    repo.getOverview(),
    repo.getTeams(),
    repo.getStudents(),
    repo.getAnalytics(),
    repo.listTransactions({ pageSize: 5 }),
    repo.listAudit(8),
  ]);
  const top = [...students].sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader title="Command center" description="Everything happening across the houses, in one place." actions={<QuickAward />} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={overview.students} icon={<Users className="size-4" />} />
        <StatCard label="Teams" value={overview.teams} icon={<Trophy className="size-4" />} />
        <StatCard label="Points awarded" value={overview.pointsAwarded} icon={<Zap className="size-4" />} />
        <StatCard label="Active events" value={overview.activeEvents} icon={<CalendarDays className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TrendChart title="Point activity" subtitle="Cumulative points by team, last 8 weeks" data={analytics.pointsOverTime} xKey="date" series={teams.map((t) => ({ key: t.slug, name: t.name, color: t.colorPrimary }))} height={300} />
        </div>
        <Panel title="Recent actions" className="xl:col-span-2" action={<Link href="/admin/settings#audit" className="text-xs text-accent hover:underline">Full log</Link>}>
          <ul className="divide-y divide-line">
            {audit.length === 0 && <li className="p-6 text-center text-sm text-dim">No actions logged yet.</li>}
            {audit.map((a) => (
              <li key={a.id} className="px-3 py-3">
                <p className="text-sm">
                  <span className="font-medium">{a.actorName}</span> <span className="text-dim">{a.action.replace(".", " ")}</span> <span className="font-medium">{a.target}</span>
                </p>
                <p className="num mt-0.5 truncate text-xs text-faint">
                  {a.detail} · {timeAgo(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Latest transactions" action={<Link href="/admin/points" className="text-xs text-accent hover:underline">Open ledger</Link>}>
          <div className="space-y-2 p-2">
            {ledger.rows.length === 0 && <p className="p-6 text-center text-sm text-dim">No transactions yet. Award the first points.</p>}
            {ledger.rows.map((t) => (
              <TransactionCard key={t.id} tx={t} href={`/transactions/${t.id}`} />
            ))}
          </div>
        </Panel>
        <Panel title="Top performers" action={<Link href="/admin/students" className="text-xs text-accent hover:underline">All students</Link>}>
          <ul className="divide-y divide-line">
            {top.map((s, i) => (
              <li key={s.id}>
                <Link href={`/students/${s.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-surface">
                  <span className="num w-5 text-center text-sm font-bold text-faint">{i + 1}</span>
                  <StudentAvatar name={s.name} color={s.teamColor} glow={s.teamGlow} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs" style={{ color: s.teamColor }}>
                      {s.teamName}
                    </p>
                  </div>
                  <span className="num font-semibold">{formatPoints(s.points)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section className="mt-10">
        <h2 className="mb-5 font-display text-xl font-semibold">Live leaderboard</h2>
        <LeaderboardView initial={teams} />
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";

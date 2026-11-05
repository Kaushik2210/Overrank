import { CalendarDays, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { AdminHeader, Panel, StatCard } from "@/components/admin/bits";
import { QuickAward } from "@/components/admin/QuickAward";
import { TrendChart } from "@/components/charts/LazyCharts";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { TransactionCard } from "@/components/points/TransactionCard";
import { getRepo } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  const repo = getRepo();
  const [overview, teams, analytics, ledger, audit] = await Promise.all([
    repo.getOverview(),
    repo.getTeams(),
    repo.getAnalytics(),
    repo.listTransactions({ pageSize: 5 }),
    repo.listAudit(8),
  ]);

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
        <Panel title="Recent actions" className="xl:col-span-2" action={<Link href="/admin/settings#audit" className="text-xs text-accent hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:min-w-11 max-sm:items-center max-sm:justify-center">Full log</Link>}>
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

      <div className="mt-6">
        <Panel title="Latest transactions" action={<Link href="/admin/points" className="text-xs text-accent hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:min-w-11 max-sm:items-center max-sm:justify-center">Open ledger</Link>}>
          <div className="space-y-2 p-2">
            {ledger.rows.length === 0 && <p className="p-6 text-center text-sm text-dim">No transactions yet. Award the first points.</p>}
            {ledger.rows.map((t) => (
              <TransactionCard key={t.id} tx={t} href={`/transactions/${t.id}`} />
            ))}
          </div>
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

import { CalendarDays, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { AdminHeader, Panel, StatCard } from "@/components/admin/bits";
import { QuickAward } from "@/components/admin/QuickAward";
import { TrendChart } from "@/components/charts/LazyCharts";
import { StatusBadge } from "@/components/feedback/Cards";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { getRepo } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  const repo = getRepo();
  const [overview, teams, analytics, suggestions, disputes, audit] = await Promise.all([
    repo.getOverview(),
    repo.getTeams(),
    repo.getAnalytics(),
    repo.listSuggestions({ status: "pending" }),
    repo.listDisputes({ status: "pending" }),
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
        <Panel title={`Pending suggestions (${suggestions.length})`} action={<Link href="/admin/suggestions" className="text-xs text-accent hover:underline">Review</Link>}>
          <ul className="divide-y divide-line">
            {suggestions.length === 0 && <li className="p-6 text-center text-sm text-dim">Queue is clear.</li>}
            {suggestions.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.activity}</p>
                  <p className="text-xs text-faint">{s.studentName} · {s.suggestedPoints} pts</p>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={`Pending disputes (${disputes.length})`} action={<Link href="/admin/disputes" className="text-xs text-accent hover:underline">Review</Link>}>
          <ul className="divide-y divide-line">
            {disputes.length === 0 && <li className="p-6 text-center text-sm text-dim">No open disputes.</li>}
            {disputes.slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.transaction?.reason ?? "Transaction"}</p>
                  <p className="truncate text-xs text-faint">{d.studentName} · {d.reason}</p>
                </div>
                <StatusBadge status={d.status} />
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

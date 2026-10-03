import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/bits";
import { BarsChart, DonutChart, Heatmap, TrendChart } from "@/components/charts/LazyCharts";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const repo = getRepo();
  const [a, teams] = await Promise.all([repo.getAnalytics(), repo.getTeams()]);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeader title="Analytics" description="Trends, mix and participation across the season." />
      <TrendChart title="Points over time" subtitle="Cumulative points by team, weekly" data={a.pointsOverTime} xKey="date" series={teams.map((t) => ({ key: t.slug, name: t.name, color: t.colorPrimary }))} height={320} />
      <div className="grid gap-6 lg:grid-cols-2">
        <BarsChart title="Team performance" subtitle="Current total points" data={a.teamPerformance.map((t) => ({ name: t.name, value: t.points, color: t.color }))} />
        <DonutChart title="Category distribution" subtitle="Share of points awarded" data={a.categoryDistribution.map((c) => ({ name: c.name, value: c.points, color: c.color }))} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarsChart title="Top contributors" subtitle="Individual points" layout="vertical" height={330} data={a.topContributors.map((s) => ({ name: s.name.split(" ")[0], value: s.points, color: s.teamColor }))} />
        <BarsChart title="Participation" subtitle="Students with at least one entry" layout="vertical" height={330} valueLabel="Active students" data={a.participation.map((p) => ({ name: p.name, value: p.active, color: p.color }))} />
      </div>
      <Heatmap rows={a.heatmap} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { CategoriesPanel, RosterPanel, TeamsPanel, XpPanel } from "@/components/admin/SettingsPanels";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminSettings() {
  const repo = getRepo();
  const [teams, categories, settings, audit] = await Promise.all([repo.getTeams(), repo.getCategories(), repo.getSettings(), repo.listAudit(40)]);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminHeader title="Settings" description="Teams, categories, the XP formula, roster imports and the audit log." />
      <TeamsPanel teams={teams} />
      <CategoriesPanel categories={categories} />
      <XpPanel xp={settings.xp} />
      <RosterPanel />
      <div id="audit" className="scroll-mt-24">
        <Panel title="Audit log">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line text-[11px] tracking-wider text-faint uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Who</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="num px-4 py-2.5 whitespace-nowrap text-dim">{when.format(new Date(a.createdAt))}</td>
                    <td className="px-4 py-2.5">{a.actorName}</td>
                    <td className="num px-4 py-2.5 text-accent">{a.action}</td>
                    <td className="px-4 py-2.5">{a.target}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-dim">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: { default: "Command center", template: "%s | HOUSECORE Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const repo = getRepo();
  const [categories, events, teams, students] = await Promise.all([repo.getCategories(), repo.listEvents(), repo.getTeams(), repo.getStudents()]);
  return (
    <AdminShell
      session={{ name: session.name, role: session.role, color: "#d4ff3a" }}
      categories={categories}
      events={events}
      teams={teams}
      students={students.map((s) => ({ id: s.id, name: s.name, teamName: s.teamName, teamColor: s.teamColor, teamId: s.teamId, points: s.points }))}
    >
      {children}
    </AdminShell>
  );
}

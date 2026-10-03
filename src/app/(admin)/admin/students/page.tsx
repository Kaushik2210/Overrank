import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/bits";
import { StudentsTable } from "@/components/admin/StudentsTable";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Students" };
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const repo = getRepo();
  const [students, teams] = await Promise.all([repo.getStudents(), repo.getTeams()]);
  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader title="Students" description="Everyone on the roster. Use the plus button to award points straight away." />
      <StudentsTable students={students} teams={teams} />
    </div>
  );
}

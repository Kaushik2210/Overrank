import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfileView } from "@/components/profile/StudentProfileView";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = await getRepo().getStudent(id);
  return { title: d?.student.name ?? "Student" };
}

export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const repo = getRepo();
  const [detail, students, session] = await Promise.all([repo.getStudent(id), repo.getStudents(), getSession()]);
  if (!detail) notFound();
  // transaction detail pages are only linked for people allowed to open them
  const canOpen = session && (session.role !== "student" || session.studentId === id);
  return <StudentProfileView detail={detail} totalStudents={students.length} txHref={canOpen ? (t) => `/transactions/${t}` : undefined} />;
}

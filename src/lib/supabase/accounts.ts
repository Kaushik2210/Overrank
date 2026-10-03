import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateLoginCode, hashLoginCode, studentEmail } from "@/lib/login-code";

type StudentRow = { student_id: string; name: string; team_id: string; user_id?: string | null };

/** Stores a fresh hashed one-time code for a student and returns the plain code (shown once to staff). */
export async function issueLoginCode(db: SupabaseClient, studentId: string) {
  const code = generateLoginCode();
  const { error } = await db.from("login_codes").upsert({ student_id: studentId, code_hash: hashLoginCode(code), created_at: new Date().toISOString() });
  if (error) throw new Error(`Could not store login code: ${error.message}`);
  return code;
}

/**
 * Creates the auth account, profile and first-login code for a student. The account starts with a random
 * password nobody knows; the student sets their own with the one-time code. No shared default password exists.
 * Returns null if the student already has an account.
 */
export async function provisionStudent(db: SupabaseClient, s: StudentRow): Promise<string | null> {
  if (s.user_id) return null;
  const { data, error } = await db.auth.admin.createUser({
    email: studentEmail(s.student_id),
    password: randomBytes(32).toString("hex"),
    email_confirm: true,
    user_metadata: { student_id: s.student_id },
  });
  if (error || !data.user) throw new Error(`Could not create account for ${s.student_id}: ${error?.message}`);
  const uid = data.user.id;
  const p = await db.from("profiles").upsert({ id: uid, role: "student", name: s.name, student_id: s.student_id, team_id: s.team_id });
  if (p.error) throw new Error(p.error.message);
  const u = await db.from("students").update({ user_id: uid }).eq("student_id", s.student_id);
  if (u.error) throw new Error(u.error.message);
  return issueLoginCode(db, s.student_id);
}

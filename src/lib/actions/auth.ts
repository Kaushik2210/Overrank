"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearPreviewSession, previewSignIn } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";
import { normaliseCode, studentEmail, verifyLoginCode } from "@/lib/login-code";
import { rateLimit } from "@/lib/rate-limit";
import { fail, ok, zodFail, type ActionResult } from "./helpers";

const idSchema = z.object({ studentId: z.string().regex(/^\d{5,12}$/, "Enter your student ID") });

export async function previewSignInAction(formData: FormData) {
  const who = formData.get("who");
  if (who === "admin") await previewSignIn("admin");
  else {
    const parsed = idSchema.safeParse({ studentId: formData.get("studentId") });
    if (!parsed.success) redirect("/login?error=id");
    try {
      await previewSignIn({ studentId: parsed.data.studentId });
    } catch {
      redirect("/login?error=id");
    }
  }
  redirect(who === "admin" ? "/admin" : "/dashboard");
}

export async function signOutAction() {
  if (hasSupabase) {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } else {
    await clearPreviewSession();
  }
  redirect("/");
}

/* ------------------------------------------------------------------ Supabase auth */


async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const signInSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your student ID or email").max(120),
  password: z.string().min(1, "Enter your password").max(200),
});

/** Student ID (or an email, for faculty) plus password. Rate limited per client and per account. */
export async function signInAction(input: unknown): Promise<ActionResult> {
  if (!hasSupabase) return fail("Sign-in is not configured");
  const p = signInSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const id = p.data.identifier.toLowerCase();
  if (!rateLimit(`signin-ip:${await clientKey()}`, 20, 10 * 60_000) || !rateLimit(`signin-id:${id}`, 8, 10 * 60_000)) {
    return fail("Too many attempts. Wait a few minutes and try again.");
  }
  const email = id.includes("@") ? id : studentEmail(id);
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password: p.data.password });
  if (error) return fail("That ID and password do not match.");
  return ok(undefined);
}

const claimSchema = z.object({
  studentId: z.string().regex(/^\d{5,12}$/, "Enter your student ID"),
  code: z.string().trim().min(6, "Enter the code from your faculty").max(20),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

/**
 * First login: the student proves who they are with the one-time code faculty hand out,
 * then chooses their own password. The code is single use and removed afterwards.
 */
export async function claimAccountAction(input: unknown): Promise<ActionResult> {
  if (!hasSupabase) return fail("Sign-in is not configured");
  const p = claimSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (!rateLimit(`claim-ip:${await clientKey()}`, 15, 10 * 60_000) || !rateLimit(`claim-id:${p.data.studentId}`, 6, 10 * 60_000)) {
    return fail("Too many attempts. Wait a few minutes and try again.");
  }
  const { createAdminSupabase } = await import("@/lib/supabase/admin");
  const admin = createAdminSupabase();
  const generic = fail("That code is not valid. Ask your faculty for a new one.");
  const { data: row } = await admin.from("login_codes").select("code_hash").eq("student_id", p.data.studentId).maybeSingle();
  if (!row || !verifyLoginCode(normaliseCode(p.data.code), row.code_hash)) return generic;
  const { data: st } = await admin.from("students").select("user_id").eq("student_id", p.data.studentId).single();
  if (!st?.user_id) return generic;
  const upd = await admin.auth.admin.updateUserById(st.user_id, { password: p.data.password });
  if (upd.error) return fail("Could not set your password. Try again.");
  await admin.from("login_codes").delete().eq("student_id", p.data.studentId);
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: studentEmail(p.data.studentId), password: p.data.password });
  if (error) return fail("Password saved. Please sign in.");
  return ok(undefined);
}

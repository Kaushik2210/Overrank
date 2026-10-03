"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearPreviewSession, previewSignIn } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import { fail, ok, zodFail, type ActionResult } from "./helpers";

/** Preview mode: one button, no password. Disabled as soon as Supabase is configured. */
export async function previewSignInAction() {
  await previewSignIn();
  redirect("/admin");
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

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your email address").max(120),
  password: z.string().min(1, "Enter your password").max(200),
});

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Faculty sign-in with email and password, rate limited per client and per account. */
export async function signInAction(input: unknown): Promise<ActionResult> {
  if (!hasSupabase) return fail("Sign-in is not configured");
  const p = signInSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (!rateLimit(`signin-ip:${await clientKey()}`, 20, 10 * 60_000) || !rateLimit(`signin-id:${p.data.email}`, 8, 10 * 60_000)) {
    return fail("Too many attempts. Wait a few minutes and try again.");
  }
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
  if (error) return fail("That email and password do not match.");
  return ok(undefined);
}

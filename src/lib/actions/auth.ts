"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearPreviewSession, previewSignIn } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import { fail, ok, zodFail, type ActionResult } from "./helpers";

/**
 * Preview mode. Locally it is one button with no password. In production (a deployed preview with no
 * Supabase) it requires PREVIEW_ADMIN_PASSWORD, and refuses entirely if that is not set.
 */
export async function previewSignInAction(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    const expected = process.env.PREVIEW_ADMIN_PASSWORD;
    if (!expected) redirect("/login?error=disabled");
    if (!rateLimit(`preview-signin:${await clientKey()}`, 8, 10 * 60_000)) redirect("/login?error=rate");
    const given = String(formData.get("password") ?? "");
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) redirect("/login?error=password");
  }
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

/* ------------------------------------------------------------ forgot / reset password */

/**
 * Where reset links point. In production this is pinned to configuration, never the Host header, because
 * a spoofed Host would otherwise let an attacker steer the emailed link to their own domain.
 */
async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  if (fixed) return fixed.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000"; // local development only
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120) });

/**
 * Sends a reset link. The answer is always the same whether or not the address has an account,
 * so the form cannot be used to find out who the faculty accounts are.
 */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  if (!hasSupabase) return fail("Password reset needs Supabase to be configured");
  const p = emailSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (!rateLimit(`reset-ip:${await clientKey()}`, 5, 15 * 60_000) || !rateLimit(`reset-email:${p.data.email}`, 3, 60 * 60_000)) {
    return fail("Too many requests. Wait a while and try again.");
  }
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(p.data.email, { redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password` });
  if (error) console.error("[reset]", error.message);
  return ok(undefined);
}

const newPasswordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords do not match", path: ["confirm"] });

/** Sets a new password for the person who just proved they own the email (the recovery link created this session). */
export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  if (!hasSupabase) return fail("Password reset needs Supabase to be configured");
  const p = newPasswordSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("This reset link has expired. Request a new one.");
  const { error } = await supabase.auth.updateUser({ password: p.data.password });
  if (error) return fail(error.message.toLowerCase().includes("same") ? "Choose a password you have not used before." : "Could not update the password. Try again.");
  await supabase.auth.signOut({ scope: "others" }); // end any other sessions that knew the old password
  return ok(undefined);
}

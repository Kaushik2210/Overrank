"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearPreviewSession, previewSignIn } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";

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

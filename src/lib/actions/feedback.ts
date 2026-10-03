"use server";

import { revalidatePath } from "next/cache";
import { fail, run, zodFail } from "./helpers";
import { getRepo } from "@/lib/data";
import { saveEvidence } from "@/lib/storage";
import { disputeSchema, resolveSchema, reviewSchema, suggestionSchema } from "@/lib/validators";
import type { Session } from "@/lib/data/types";

async function maybeEvidence(fd: FormData, s: Session) {
  const f = fd.get("evidence");
  return f instanceof File && f.size > 0 ? saveEvidence(f, s) : null;
}

export async function createSuggestionAction(fd: FormData) {
  const p = suggestionSchema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")));
  if (!p.success) return zodFail(p.error);
  const r = await run({ limit: ["suggest", 5, 10 * 60_000] }, async (s) => {
    const evidenceUrl = await maybeEvidence(fd, s);
    return getRepo().createSuggestion(s, { ...p.data, evidenceUrl });
  });
  revalidatePath("/suggestions");
  return r;
}

export async function createDisputeAction(fd: FormData) {
  const p = disputeSchema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")));
  if (!p.success) return zodFail(p.error);
  const r = await run({ limit: ["dispute", 5, 10 * 60_000] }, async (s) => {
    const evidenceUrl = await maybeEvidence(fd, s);
    return getRepo().createDispute(s, { ...p.data, evidenceUrl });
  });
  revalidatePath("/disputes");
  return r;
}

export async function reviewSuggestionAction(input: unknown) {
  const p = reviewSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (p.data.decision === "approved" && p.data.points != null && p.data.points < 1) return fail("Approved suggestions need at least 1 point");
  const r = await run({ staff: true }, (s) => getRepo().reviewSuggestion(s, p.data.id, p.data.decision, p.data.points ?? null, p.data.note));
  revalidatePath("/admin/suggestions");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return r;
}

export async function resolveDisputeAction(input: unknown) {
  const p = resolveSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (p.data.decision === "modified" && !p.data.newAmount) return fail("Enter the corrected amount", { newAmount: "Required" });
  const r = await run({ staff: true }, (s) => getRepo().resolveDispute(s, p.data.id, p.data.decision, p.data.newAmount ?? null, p.data.note));
  revalidatePath("/admin/disputes");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return r;
}

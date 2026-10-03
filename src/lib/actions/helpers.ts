import "server-only";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import type { Session } from "@/lib/data/types";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({ ok: false, error, fieldErrors });

export function zodFail(e: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return fail(e.issues[0]?.message ?? "Invalid input", fieldErrors);
}

/** Run a mutation as the signed-in faculty member. Errors become typed results instead of crashing the page. */
export async function run<T>(opts: { staff?: boolean; limit?: [string, number, number] } = {}, fn: (s: Session) => Promise<T>): Promise<ActionResult<T>> {
  const session = await requireStaff();
  if (opts.limit) {
    const [name, n, ms] = opts.limit;
    if (!rateLimit(`${name}:${session.userId}`, n, ms)) return fail("Too many requests. Please wait a moment and try again.");
  }
  try {
    return ok(await fn(session));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong");
  }
}

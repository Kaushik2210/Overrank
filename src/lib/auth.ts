import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepo, hasSupabase } from "@/lib/data";
import type { Session } from "@/lib/data/types";

const COOKIE = "hc_session";
const MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Preview mode only. A stable secret is taken from SESSION_SECRET when present;
 * otherwise a per-process one is used, which just means previews sign you out on restart.
 */
const g = globalThis as unknown as { __hcSecret?: string };
const secret = () => process.env.SESSION_SECRET ?? (g.__hcSecret ??= randomBytes(32).toString("hex"));

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(s: Session) {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  if (hasSupabase) {
    const { getSupabaseSession } = await import("@/lib/supabase/session");
    return getSupabaseSession();
  }
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireStaff(): Promise<Session> {
  const s = await requireSession();
  if (s.role === "student") redirect("/dashboard");
  return s;
}

/** Preview mode sign-in. Not available when Supabase is configured. */
export async function previewSignIn(who: "admin" | { studentId: string }) {
  if (hasSupabase) throw new Error("Preview sign-in is disabled when Supabase is configured");
  let session: Session;
  if (who === "admin") {
    session = { userId: "admin", role: "admin", name: "Faculty Admin", studentId: null, teamId: null };
  } else {
    const st = await getRepo().findStudent(who.studentId);
    if (!st) throw new Error("Unknown student ID");
    session = { userId: st.id, role: "student", name: st.name, studentId: st.id, teamId: st.teamId };
  }
  const jar = await cookies();
  jar.set(COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearPreviewSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

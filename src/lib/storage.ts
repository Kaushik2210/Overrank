import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasSupabase } from "@/lib/data";
import type { Session } from "@/lib/data/types";

export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

const KINDS = [
  { ext: "png", mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "jpg", mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { ext: "webp", mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] },
  { ext: "pdf", mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
] as const;

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

/** Check size and the file's real header bytes, not just the name or the type the browser claims. */
export function inspectEvidence(buf: Buffer, claimedMime: string) {
  if (buf.length === 0) throw new Error("That file is empty");
  if (buf.length > MAX_EVIDENCE_BYTES) throw new Error("Evidence must be 5 MB or smaller");
  const kind = KINDS.find((k) => k.magic.every((b, i) => buf[i] === b));
  if (!kind || kind.mime !== (claimedMime === "image/jpg" ? "image/jpeg" : claimedMime)) throw new Error("Evidence must be a PNG, JPG, WebP or PDF file");
  return kind;
}

/** Stores an uploaded file privately and returns an opaque storage path (not a public URL). */
export async function saveEvidence(file: File, session: Session): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = inspectEvidence(buf, file.type);
  const key = `${session.userId.replace(/[^\w-]/g, "")}/${randomUUID()}.${kind.ext}`;
  if (hasSupabase) {
    const { createAdminSupabase } = await import("@/lib/supabase/admin");
    const { error } = await createAdminSupabase().storage.from("evidence").upload(key, buf, { contentType: kind.mime, upsert: false });
    if (error) throw new Error("Upload failed. Please try again.");
  } else {
    const full = path.join(UPLOAD_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buf);
  }
  return key;
}

/** Turns a stored path into something a browser can open. Supabase paths get a short-lived signed URL. */
export async function evidenceHref(key: string | null): Promise<string | null> {
  if (!key) return null;
  if (hasSupabase) {
    const { createAdminSupabase } = await import("@/lib/supabase/admin");
    const { data } = await createAdminSupabase().storage.from("evidence").createSignedUrl(key, 60 * 10);
    return data?.signedUrl ?? null;
  }
  return `/api/evidence/${key}`;
}

export async function readLocalEvidence(key: string) {
  const full = path.resolve(UPLOAD_DIR, key);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) throw new Error("bad path");
  const buf = await readFile(full);
  const ext = path.extname(full).slice(1);
  return { buf, mime: KINDS.find((k) => k.ext === ext)?.mime ?? "application/octet-stream" };
}

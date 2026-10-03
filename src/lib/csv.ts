import type { RosterRow } from "@/lib/data/types";

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF or LF, BOM tolerated. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') (cur += '"'), i++;
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(cur), (cur = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/** Expects a header of team,studentId,name (any order, any case). */
export function parseRosterCsv(text: string): { rows: RosterRow[]; error?: string } {
  const all = parseCsv(text);
  if (all.length === 0) return { rows: [], error: "The file is empty" };
  const head = all[0].map((h) => h.trim().toLowerCase());
  const idx = { team: head.indexOf("team"), studentId: head.indexOf("studentid"), name: head.indexOf("name") };
  if (Object.values(idx).some((i) => i < 0)) return { rows: [], error: "Header must contain team, studentId and name" };
  return { rows: all.slice(1).map((r) => ({ team: r[idx.team] ?? "", studentId: r[idx.studentId] ?? "", name: r[idx.name] ?? "" })) };
}

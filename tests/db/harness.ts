import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Minimal stand-in for the parts of Supabase the migrations rely on: auth.users, auth.uid() and the API roles. */
const STUB = `
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
grant select on auth.users to service_role;
`;

export async function freshDb() {
  const db = new PGlite();
  await db.exec(STUB);
  const dir = path.resolve(import.meta.dirname, "../../supabase/migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(path.join(dir, f), "utf8"));
  return db;
}

export type Who = "anon" | "service_role" | { user: string };

/** Run a callback as a given database role, the way PostgREST would. Always resets the role afterwards. */
export async function as<T>(db: PGlite, who: Who, fn: () => Promise<T>): Promise<T> {
  if (who === "service_role") await db.exec("set role service_role");
  else if (who === "anon") await db.exec("set role anon; select set_config('request.jwt.claim.sub', '', false)");
  else await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${who.user}', false)`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false)");
  }
}

export async function expectDenied(p: Promise<unknown>) {
  let err: unknown;
  try {
    await p;
  } catch (e) {
    err = e;
  }
  if (!err) throw new Error("expected the statement to be rejected, but it succeeded");
  return String((err as Error).message);
}

export type Seeded = Awaited<ReturnType<typeof seedBasics>>;

/** Two teams, three students, one admin, one teacher and one stranger (signed in, no faculty profile), two categories. */
export async function seedBasics(db: PGlite) {
  const id = async (sql: string) => (await db.query<{ id: string }>(sql)).rows[0].id;
  const u = {
    admin: await id("insert into auth.users (email) values ('admin@x.local') returning id"),
    teacher: await id("insert into auth.users (email) values ('teacher@x.local') returning id"),
    stranger: await id("insert into auth.users (email) values ('stranger@x.local') returning id"),
  };
  const teamA = await id("insert into teams (name, slug, color_primary, color_glow) values ('Alpha','alpha','#22C55E','#4ADE80') returning id");
  const teamB = await id("insert into teams (name, slug, color_primary, color_glow) values ('Beta','beta','#2563EB','#60A5FA') returning id");
  await db.exec(`
    insert into students (student_id, name, team_id) values
      ('2647101','Ada', '${teamA}'),
      ('2647102','Bea', '${teamA}'),
      ('2647110','Cy',  '${teamB}');
    insert into profiles (id, role, name) values
      ('${u.admin}', 'admin', 'Admin'),
      ('${u.teacher}', 'teacher', 'Teacher');
  `);
  const sports = await id("insert into point_categories (name, slug) values ('Sports','sports') returning id");
  const other = await id("insert into point_categories (name, slug) values ('Other','other') returning id");
  return { u, teamA, teamB, sports, other };
}

# OVERRANK

A campus house competition platform. Teams earn points, the leaderboard updates live, and faculty manage everything.
Students do not sign in: the leaderboard, team pages, events, achievements and player profiles are public and read-only.
Only faculty sign in, to award points and manage the season.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no Supabase variables set, the app runs in **preview mode**: an in-memory season built from `data/roster.json` plus flagged demo activity (set `OVERRANK_DEMO=0` for an empty season). Sign in with the faculty button on `/login`. Preview mode has no password and is for local use only.

## Use Supabase

1. Create a project, run the SQL in `supabase/migrations` in order.
2. Copy `.env.example` to `.env.local` and fill in the keys.
3. `npm run seed` creates teams, the 60 roster students (0 points), categories, achievements and the faculty admin (password printed once if `ADMIN_PASSWORD` is empty).
4. Optional: `npm run seed:demo` adds flagged demo data, `npm run seed:demo:clear` removes it.

## Scripts

`npm test` (unit and database tests, Postgres via PGlite), `npm run test:e2e` (Playwright), `npm run typecheck`, `npm run lint`, `npm run build`.

## Stack

Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres, Auth, RLS, Realtime, Storage), Motion, Recharts, cmdk, zod, react-hook-form.

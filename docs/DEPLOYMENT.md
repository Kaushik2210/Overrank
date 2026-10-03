# Deployment guide

This takes a fresh clone to a live site on **Supabase** (database and auth) and **Vercel** (hosting). About ten minutes.

## 1. Create the Supabase project

1. Sign in at <https://supabase.com> and click **New project**. Choose a region close to your users and save the database password.
2. Open **SQL Editor** and run the files in [`supabase/migrations`](../supabase/migrations) **in this order**:
   1. `20261001000000_schema.sql`
   2. `20261001000100_rls_and_rpc.sql`
   3. `20261001000200_storage.sql`
3. Open **Project Settings → API** and copy the project URL, the anon key and the service-role key.

## 2. Configure authentication

Under **Authentication**:

- **Sign In / Providers → User Signups:** turn **off** *Allow new users to sign up*. Faculty accounts are created by you, not by visitors.
- **URL Configuration:**
  - *Site URL*: your production URL, for example `https://your-site.vercel.app`
  - *Redirect URLs*: add `https://your-site.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local work)

The redirect entry is what lets the "Forgot your password?" link land back on your site.

## 3. Seed the data

Copy `.env.example` to `.env.local`, fill in the three Supabase values and set `ADMIN_EMAIL` (and optionally `ADMIN_PASSWORD`), then:

```bash
npm install
npm run seed
```

This creates the teams, the roster from `data/roster.json` (every student at 0 points), point categories, achievements and the faculty admin. It is idempotent and never overwrites edits made in the admin area. If `ADMIN_PASSWORD` is empty, a password is generated and printed once.

> On some networks `*.supabase.co` is blocked or its DNS is hijacked, which makes scripts on your machine fail while your browser works. Set `OVERRANK_DOH=1` for the dev server. For a one-off seed, run it from a network that can reach Supabase.

## 4. Deploy to Vercel

1. Import the repository in Vercel (or run `npx vercel`).
2. Add these environment variables for **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy: `npx vercel deploy --prod`.

## 5. Check it

```bash
BASE=https://your-site.vercel.app EMAIL=you@example.com PASSWORD=your-password node scripts/smoke-live.mjs
```

The smoke test is read-only. It checks the public pages, that `/admin` is locked for visitors, and that a faculty sign-in works.

## Adding faculty

Create another user under **Authentication → Users**, then add a matching row in `profiles` with role `teacher` or `admin`. Teachers and admins have the same access today.

## Without Supabase (preview deployment)

If the Supabase variables are absent, the app runs in preview mode with in-memory data. In production this requires `PREVIEW_ADMIN_PASSWORD` and `SESSION_SECRET`, and data resets whenever the platform restarts the instance. Use it for demos only.

## Resetting a season

Points live in an append-only ledger and cannot be edited. To start a new season, create a new Supabase project (or reset the database) and run the migrations and seed again.

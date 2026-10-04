# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report them privately through GitHub: **Security → Report a vulnerability** on this repository. Include what you found, how to reproduce it, and the impact you expect. You will get an acknowledgement within a few days.

## Scope

OVERRANK holds a roster of student names and IDs and a record of points awarded. Issues of particular interest:

- reading or changing data without a faculty sign-in
- changing a point total without going through the award or reverse functions
- bypassing Row Level Security
- uploading or retrieving evidence files you should not be able to reach
- anything that exposes the service-role key

## Design notes

- Row Level Security is enabled on every table. Anonymous visitors can read only public reference data and the leaderboard view.
- Point mutations go through `award_points` and `reverse_transaction`, which re-check the caller's role and are executable by the service role only.
- The ledger is append-only at the database level.
- Secrets are read from environment variables. `.env*` files are git-ignored, and the service-role key is used only in server code.

## How injection is prevented

- **No string-built SQL.** The app talks to the database only through the Supabase client, which sends values as parameters, and through two database functions that take typed parameters. The functions contain no dynamic SQL.
- **Validation at the door.** Every server action validates its input with zod. Identifiers must match a strict character set, student IDs are digits only, colours and icon names are allow-listed patterns, and text fields have length limits. The tests feed classic SQL-injection, path-traversal and script payloads to these schemas and require every one to be rejected.
- **Least privilege underneath.** Even a request that slipped through would run as a role that cannot change the ledger, and the database refuses edits and deletes to it.
- **No HTML injection sinks.** React escapes output, and nothing uses `dangerouslySetInnerHTML`. CSV exports neutralise spreadsheet formulas. Uploaded evidence is checked by file signature, so scriptable types such as SVG are refused.
- **Redirects and links are pinned.** The email-link callback only ever redirects to a fixed page, and the password-reset link is built from configuration, never the request's `Host` header.
- **Response headers** set `nosniff`, deny framing, restrict forms and base URLs, and enforce HTTPS.

## Verification performed

Against a live Supabase project, using only the public anon key, an anonymous client was confirmed unable to: read the ledger, roster, profiles or audit log; insert, edit or delete anything; call the point functions; create an account; or list the private evidence bucket. SQL-injection payloads in filters, ordering and column lists changed nothing, and the data was intact afterwards. The production dependency audit reports no known vulnerabilities, and a scan of the built client files found no server secrets.

Rate limiting on sign-in and password reset is held in memory per server instance, so on serverless hosting it is a speed bump rather than a hard limit. Supabase Auth applies its own limits on top.

## Supported versions

Only the latest commit on `main` is supported.

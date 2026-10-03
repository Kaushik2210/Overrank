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

## Supported versions

Only the latest commit on `main` is supported.

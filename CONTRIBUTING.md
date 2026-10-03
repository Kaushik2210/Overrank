# Contributing

Thanks for taking a look. Small, focused pull requests are easiest to review.

## Setup

```bash
npm install
npm run dev:preview     # full app in memory, no accounts needed
```

## Before you open a pull request

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

CI runs the same checks plus a production build.

## Guidelines

- **TypeScript is strict.** Avoid `any`; validate external input with zod.
- **Points only change through the repo layer** and the two database functions. Do not write to the ledger from anywhere else.
- **Animate `transform` and `opacity` only**, and respect reduced motion. Shared motion tokens live in `src/lib/motion.ts`.
- **Database changes** go in a new file under `supabase/migrations`, with a test in `tests/db` that covers any new policy.
- **Commits** use short imperative subjects, for example `add season replay scrubber`.

## Reporting bugs

Open an issue with the steps to reproduce, what you expected, and what happened. For security problems, follow [SECURITY.md](SECURITY.md) instead.

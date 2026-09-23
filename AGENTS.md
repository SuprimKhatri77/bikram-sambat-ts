# AGENTS.md

Guidance for AI coding agents working in this repository. `CONTRIBUTING.md`
is the human-facing version; keep the two consistent.

## What this is

`bikram-sambat-ts` is a small, zero-dependency TypeScript library that converts between
the Gregorian (AD) and Bikram Sambat (BS) calendars for BS 1979–2100. It's the
TypeScript sibling of the Go package `go-bs`
(`github.com/suprimkhatri77/go-bs`), which is the **reference
specification**: where the two overlap, they must give identical results.

## Rules

- Never hand-edit `src/data.ts`, `data/calendar.json` or `tests/fixtures/*`.
  They're generated (see `docs/calendar-data.md`). Calendar data changes come
  from go-bs, with a cited source.
- `src/` must not import Node built-ins or use `process`/`Buffer`.
- Use Bun as the package manager and test runner (`bun install`, `bun test`).
- Before considering a change done, run: `bun run typecheck`, `bun run lint`,
  `bun run format:check`, `bun test`, `bun run test:timezones`,
  `bun run build`, `bun run test:smoke`.
- Never publish to npm and never push to a remote. Leave both to the
  maintainer.

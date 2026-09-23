# Contributing

Thanks for helping. This is a small library, and its main job is to give
correct dates, identical to its Go sibling
[go-bs](https://github.com/suprimkhatri77/go-bs).

## Setup

You need [Bun](https://bun.sh) 1.3 or newer. Node.js 18 or newer is also
needed for the smoke tests.

```sh
bun install
```

## Before opening a pull request

```sh
bun run typecheck
bun run lint
bun run format:check
bun test
bun run test:timezones
bun run build
bun run test:smoke
bun run check:package
```

All of these must pass. CI runs the same checks.

## Guidelines

- The library code in `src/` must stay dependency-free and must not use
  Node-only APIs (`fs`, `path`, `process`, `Buffer`, ...). ESLint enforces
  this. Tooling in `scripts/` and `tools/` can use anything.
- Every exported function needs a JSDoc comment that explains its behavior,
  what it throws, and an example where that helps.
- Where a feature overlaps with go-bs, it should behave the same way. If
  there's a good reason to differ, document it in the README's "Compatibility
  with go-bs" section.
- Keep the scope to BS/AD conversion, validation, arithmetic and formatting.
  UI components and other calendar systems belong elsewhere.

## Calendar data changes

`src/data.ts` and `data/calendar.json` are generated. Never edit them by hand.
The data changes only when go-bs's data changes, following the steps in
[docs/calendar-data.md](docs/calendar-data.md#changing-the-data). A pull
request that changes the calendar data must include:

- the BS year(s) and month(s) affected
- the verification source: an independently checkable source (a live calendar
  or an official publication), not just another library's table
- regenerated compatibility fixtures (`tests/fixtures/`) from the new go-bs
  version
- updated tests, e.g. a new known AD/BS pair in `tests/convert.test.ts` and an
  updated checksum in `tests/data.test.ts`

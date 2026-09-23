// Smoke test for the built ESM entry point, run with plain Node (not Bun) and
// importing the package by name so the "exports" map is what gets exercised.
// Checks every supported date against the go-bs fixture.
//
// Usage: bun run build && node scripts/smoke.mjs

import { readFileSync } from "node:fs";
import * as bs from "bikram-sambat-ts";

const fixture = JSON.parse(
  readFileSync(new URL("../tests/fixtures/go-conversions.json", import.meta.url), "utf8"),
);

const pad = (n) => String(n).padStart(2, "0");
const localYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

let checked = 0;
let skipped = 0;
for (const [bsString, adString] of fixture.days) {
  const [y, m, d] = adString.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  if (localYmd(local) !== adString) {
    skipped++; // a day this timezone skipped entirely; see the README
    continue;
  }
  const date = bs.parseBsDate(bsString);
  if (localYmd(bs.bsToAd(date)) !== adString || bs.formatBsDate(bs.adToBs(local)) !== bsString) {
    throw new Error(`ESM build disagrees with go-bs for BS ${bsString} / AD ${adString}`);
  }
  checked++;
}
if (checked + skipped !== 44562 || skipped > 1) {
  throw new Error(`unexpected counts: checked ${checked}, skipped ${skipped}`);
}
try {
  bs.bsToAd({ year: 2101, month: 1, day: 1 });
  throw new Error("expected InvalidBSDateError");
} catch (error) {
  if (!(error instanceof bs.InvalidBSDateError) || error.field !== "year") throw error;
}

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(`ESM ok (node ${process.version}, ${tz}): ${checked} dates match go-bs`);

// Smoke test for the built CommonJS entry point: require() the package by
// name and check a few known go-bs pairs.
//
// Usage: bun run build && node scripts/smoke.cjs

const assert = require("node:assert/strict");
const bs = require("bikram-sambat-ts");

assert.deepEqual(bs.adToBs(new Date(2026, 8, 22)), { year: 2083, month: 6, day: 6 });
assert.deepEqual(bs.adToBs(new Date(1922, 3, 13)), { year: 1979, month: 1, day: 1 });
assert.deepEqual(bs.adToBs(new Date(2044, 3, 13)), { year: 2100, month: 12, day: 31 });
assert.equal(bs.bsToAd({ year: 2083, month: 6, day: 6 }).getDate(), 22);
assert.equal(
  bs.formatBsDate({ year: 2083, month: 6, day: 6 }, "dddd, MMMM D"),
  "Tuesday, Ashwin 6",
);
assert.throws(() => bs.adToBs(new Date(2044, 3, 14)), bs.DateOutOfRangeError);
assert.throws(() => bs.parseBsDate("2083/06/06"), bs.BSDateFormatError);
assert.equal(bs.MIN_BS_YEAR, 1979);
assert.equal(bs.MAX_BS_YEAR, 2100);

console.log(`CJS ok (node ${process.version})`);

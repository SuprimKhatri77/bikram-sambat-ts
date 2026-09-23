// This package converts calendar dates, not instants: adToBs reads a Date's
// local calendar components and bsToAd returns local midnight, so results
// must not depend on the runtime's timezone.
//
// These tests check the timezone of the current process. `bun test` defaults
// to UTC; `bun run test:timezones` (and CI) re-runs the whole suite under
// several other zones via the TZ environment variable. Changing
// process.env.TZ mid-run isn't used, because Bun caches local-time offsets
// and doesn't reliably honor a change within one process.

import { describe, expect, test } from "bun:test";
import conversions from "./fixtures/go-conversions.json";
import { adToBs, bsToAd, formatBsDate } from "../src";
import { SKIPPED_LOCAL_DAYS, bs, localDate, localYmd } from "./helpers";

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe(`in the process timezone (${tz})`, () => {
  test("a known pair converts identically at any time of day", () => {
    for (const hour of [0, 1, 12, 23]) {
      expect(adToBs(new Date(2026, 8, 22, hour, 59))).toEqual(bs("2083-06-06"));
    }
    expect(localYmd(bsToAd(bs("2083-06-06")))).toBe("2026-09-22");
  });

  test("every supported date matches go-bs in both directions", () => {
    let mismatches = 0;
    for (const [bsString, adString] of conversions.days as [string, string][]) {
      if (SKIPPED_LOCAL_DAYS.has(adString)) {
        continue;
      }
      if (
        localYmd(bsToAd(bs(bsString))) !== adString ||
        formatBsDate(adToBs(localDate(adString))) !== bsString
      ) {
        mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  });

  test("at most one AD day in the supported range is missing from the local calendar", () => {
    // Only zones that jumped across the date line (Pacific/Kiritimati,
    // Pacific/Apia, ...) have one; see "Timezone behavior" in the README.
    expect(SKIPPED_LOCAL_DAYS.size).toBeLessThanOrEqual(1);
  });

  test("a UTC-midnight Date is read by its local date (documented pitfall)", () => {
    // new Date("2026-09-22") is UTC midnight. West of UTC its local date is
    // still 21 September, so it converts to the BS date for the 21st.
    const utcMidnight = new Date("2026-09-22");
    const expected = utcMidnight.getTimezoneOffset() > 0 ? "2083-06-05" : "2083-06-06";
    expect(adToBs(utcMidnight)).toEqual(bs(expected));
    // A date-time string without "Z" is local time, so this is always the 22nd.
    expect(adToBs(new Date("2026-09-22T00:00"))).toEqual(bs("2083-06-06"));
  });
});

import { describe, expect, test } from "bun:test";
import {
  DateOutOfRangeError,
  InvalidBSDateError,
  MAX_BS_YEAR,
  adToBs,
  bsToAd,
  daysInBsMonth,
  type BSDate,
} from "../src";
import { SKIPPED_LOCAL_DAYS, bs, forEachBsDate, localDate, localYmd } from "./helpers";

// Independently verified AD/BS pairs, ported verbatim from go-bs's
// convert_test.go (knownPairs). See docs/calendar-data.md for sources.
const KNOWN_PAIRS: readonly { name: string; bs: string; ad: string }[] = [
  { name: "min supported date (reference)", bs: "1979-01-01", ad: "1922-04-13" },
  { name: "last day of first supported year", bs: "1979-12-30", ad: "1923-04-12" },
  { name: "BS 2000 new year", bs: "2000-01-01", ad: "1943-04-14" },
  { name: "BS 2010 new year", bs: "2010-01-01", ad: "1953-04-13" },
  { name: "BS 2062 new year", bs: "2062-01-01", ad: "2005-04-14" },
  { name: "BS 2081 new year", bs: "2081-01-01", ad: "2024-04-13" },
  { name: "BS 2082 new year", bs: "2082-01-01", ad: "2025-04-14" },
  { name: "BS 2083 mid-year", bs: "2083-06-06", ad: "2026-09-22" },
  { name: "max supported date", bs: "2100-12-31", ad: "2044-04-13" },
];

describe("known pairs (from go-bs)", () => {
  for (const pair of KNOWN_PAIRS) {
    test(`${pair.name}: BS ${pair.bs} <-> AD ${pair.ad}`, () => {
      expect(localYmd(bsToAd(bs(pair.bs)))).toBe(pair.ad);
      expect(adToBs(localDate(pair.ad))).toEqual(bs(pair.bs));
    });
  }
});

describe("bsToAd", () => {
  test("returns local midnight", () => {
    const ad = bsToAd(bs("2083-06-06"));
    expect([ad.getHours(), ad.getMinutes(), ad.getSeconds(), ad.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);
  });

  test("returns a new Date each call", () => {
    const a = bsToAd(bs("2083-06-06"));
    a.setFullYear(1900);
    expect(localYmd(bsToAd(bs("2083-06-06")))).toBe("2026-09-22");
  });

  test("rejects invalid BS dates", () => {
    expect(() => bsToAd(bs("2101-01-01"))).toThrow(InvalidBSDateError);
    expect(() => bsToAd(bs("2083-13-01"))).toThrow(InvalidBSDateError);
    expect(() => bsToAd(bs("2083-06-32"))).toThrow(InvalidBSDateError);
  });

  test("rejects non-objects with a TypeError", () => {
    for (const value of [null, undefined, "2083-06-06", 20830606]) {
      expect(() => bsToAd(value as unknown as BSDate)).toThrow(TypeError);
    }
  });
});

describe("adToBs", () => {
  test("ignores time of day", () => {
    expect(adToBs(new Date(2026, 8, 22, 0, 0, 0, 0))).toEqual(bs("2083-06-06"));
    expect(adToBs(new Date(2026, 8, 22, 12, 30))).toEqual(bs("2083-06-06"));
    expect(adToBs(new Date(2026, 8, 22, 23, 59, 59, 999))).toEqual(bs("2083-06-06"));
  });

  test("does not modify its argument", () => {
    const date = new Date(2026, 8, 22, 15, 45);
    const before = date.getTime();
    adToBs(date);
    expect(date.getTime()).toBe(before);
  });

  test("rejects dates just outside the supported range", () => {
    expect(() => adToBs(new Date(1922, 3, 12))).toThrow(DateOutOfRangeError);
    expect(() => adToBs(new Date(2044, 3, 14))).toThrow(DateOutOfRangeError);
    expect(() => adToBs(new Date(1922, 3, 12, 23, 59, 59, 999))).toThrow(DateOutOfRangeError);
    expect(() => adToBs(new Date(2044, 3, 14, 0, 0))).toThrow(/after the maximum/);
    expect(() => adToBs(new Date(1922, 3, 12))).toThrow(/1922-04-12 is before the minimum/);
  });

  test("rejects far-away dates, including the extremes of Date", () => {
    expect(() => adToBs(new Date(8.64e15))).toThrow(DateOutOfRangeError);
    expect(() => adToBs(new Date(-8.64e15))).toThrow(DateOutOfRangeError);
  });

  test("does not treat AD years 0-99 as 1900-1999", () => {
    // new Date(y, ...) and Date.UTC map two-digit years to 19xx; a Date that
    // genuinely represents AD 0050 must not be converted as if it were 1950.
    const ad50 = new Date(2000, 0, 1);
    ad50.setFullYear(50, 0, 1);
    expect(ad50.getFullYear()).toBe(50);
    expect(() => adToBs(ad50)).toThrow(DateOutOfRangeError);
  });

  test("rejects Invalid Date", () => {
    expect(() => adToBs(new Date(Number.NaN))).toThrow(TypeError);
    expect(() => adToBs(new Date("not a date"))).toThrow(/Invalid Date/);
  });

  test("rejects non-Date values", () => {
    for (const value of [undefined, null, 0, Date.now(), "2026-09-22", {}, { getTime: () => 0 }]) {
      expect(() => adToBs(value as unknown as Date)).toThrow(TypeError);
    }
  });
});

describe("boundary transitions", () => {
  test("last day of Chaitra rolls into Baisakh 1", () => {
    const last = { year: 2079, month: 12, day: daysInBsMonth(2079, 12) };
    const ad = bsToAd(last);
    ad.setDate(ad.getDate() + 1);
    expect(adToBs(ad)).toEqual(bs("2080-01-01"));
  });

  test("last day of a month rolls into day 1 of the next", () => {
    const last = { year: 2080, month: 6, day: daysInBsMonth(2080, 6) };
    const ad = bsToAd(last);
    ad.setDate(ad.getDate() + 1);
    expect(adToBs(ad)).toEqual(bs("2080-07-01"));
  });

  test("every BS month starts the day after the previous month ends", () => {
    let previous: string | undefined;
    for (let year = 1979; year <= MAX_BS_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const first = bsToAd({ year, month, day: 1 });
        if (previous !== undefined) {
          const dayBefore = new Date(first);
          dayBefore.setDate(dayBefore.getDate() - 1);
          expect(localYmd(dayBefore)).toBe(previous);
        }
        previous = localYmd(bsToAd({ year, month, day: daysInBsMonth(year, month) }));
      }
    }
  });
});

describe("exhaustive round trips", () => {
  test("BS -> AD -> BS for every supported BS date", () => {
    const mismatches: string[] = [];
    const count = forEachBsDate((date) => {
      const back = adToBs(bsToAd(date));
      if (back.year !== date.year || back.month !== date.month || back.day !== date.day) {
        mismatches.push(`${JSON.stringify(date)} -> ${JSON.stringify(back)}`);
      }
    });
    expect(count).toBe(44562);
    // Only a day the local timezone skipped entirely (see SKIPPED_LOCAL_DAYS)
    // can't round-trip: no Date has it as its local date. Everywhere else
    // this is an empty list.
    expect(mismatches.length).toBe(SKIPPED_LOCAL_DAYS.size);
  });

  test("AD -> BS -> AD for every Gregorian date from 1922-04-13 to 2044-04-13", () => {
    let count = 0;
    const ad = new Date(1922, 3, 13);
    while (localYmd(ad) <= "2044-04-13") {
      const expected = localYmd(ad);
      const back = localYmd(bsToAd(adToBs(ad)));
      if (back !== expected) {
        throw new Error(`AD round trip mismatch: ${expected} -> ${back}`);
      }
      count++;
      ad.setDate(ad.getDate() + 1);
    }
    // Stepping by local days never visits a day the timezone skipped.
    expect(count + SKIPPED_LOCAL_DAYS.size).toBe(44562);
  });
});

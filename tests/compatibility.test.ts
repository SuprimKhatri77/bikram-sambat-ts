// Compatibility with the Go reference implementation, go-bs. The fixtures in
// tests/fixtures were produced by running the published go-bs module (see
// tools/go-reference); these tests never run Go themselves.

import { describe, expect, test } from "bun:test";
import conversions from "./fixtures/go-conversions.json";
import cases from "./fixtures/go-cases.json";
import {
  addBsDays,
  adToBs,
  bsToAd,
  daysBetweenBs,
  formatBsDate,
  fromNepaliDigits,
  getBsDayOfWeek,
  getBsMonthName,
  getBsMonthNameNepali,
  isValidBsDate,
  parseBsDate,
  toNepaliDigits,
} from "../src";
import { SKIPPED_LOCAL_DAYS, bs, expectGoError, localDate, localYmd } from "./helpers";

const GO_SOURCE = "github.com/suprimkhatri77/go-bs@v0.6.1";

describe(`every supported date matches ${GO_SOURCE}`, () => {
  const days = conversions.days as [string, string, number, number][];

  test("fixture is complete and from the expected go-bs release", () => {
    expect(conversions.source).toBe(GO_SOURCE);
    expect(cases.source).toBe(GO_SOURCE);
    expect(days.length).toBe(44562);
    expect(conversions.count).toBe(44562);
    expect(days[0]).toEqual(["1979-01-01", "1922-04-13", 4, 1]);
    expect(days.at(-1)).toEqual(["2100-12-31", "2044-04-13", 3, 366]);
  });

  test("bsToAd, adToBs, getBsDayOfWeek and day-of-year agree with Go for all 44,562 dates", () => {
    let mismatches = 0;
    for (const [bsString, adString, weekday, dayOfYear] of days) {
      if (SKIPPED_LOCAL_DAYS.has(adString)) {
        continue;
      }
      const date = bs(bsString);
      const ok =
        localYmd(bsToAd(date)) === adString &&
        formatBsDate(adToBs(localDate(adString))) === bsString &&
        getBsDayOfWeek(date) === weekday &&
        daysBetweenBs({ year: date.year, month: 1, day: 1 }, date) + 1 === dayOfYear;
      if (!ok && mismatches++ < 10) {
        console.error("mismatch with go-bs:", bsString, adString, weekday, dayOfYear);
      }
    }
    expect(mismatches).toBe(0);
  });

  test("supported AD range matches Go", () => {
    expect(cases.minAD).toBe("1922-04-13");
    expect(cases.maxAD).toBe("2044-04-13");
    expect(localYmd(bsToAd(bs("1979-01-01")))).toBe(cases.minAD);
    expect(localYmd(bsToAd(bs("2100-12-31")))).toBe(cases.maxAD);
  });
});

describe("edge cases match go-bs", () => {
  test("validation (NewDate / IsValid)", () => {
    for (const c of cases.validation) {
      const date = { year: c.year, month: c.month, day: c.day };
      expect(isValidBsDate(date)).toBe(c.valid);
      if (c.error === "") {
        expect(bsToAd(date)).toBeInstanceOf(Date);
      } else {
        expectGoError(() => bsToAd(date), c.error);
      }
    }
  });

  test("adToBs at and beyond both ends of the range, and around every BS new year", () => {
    for (const c of cases.adToBs) {
      if (c.error === "") {
        expect(formatBsDate(adToBs(localDate(c.ad)))).toBe(c.bs);
      } else {
        expectGoError(() => adToBs(localDate(c.ad)), c.error);
      }
    }
  });

  test("parseBsDate (Parse)", () => {
    for (const c of cases.parse) {
      if (c.error === "") {
        expect(formatBsDate(parseBsDate(c.input))).toBe(c.bs);
      } else {
        expectGoError(() => parseBsDate(c.input), c.error);
      }
    }
  });

  test("formatBsDate (Date.Format)", () => {
    for (const c of cases.format) {
      expect(formatBsDate(bs(c.bs), c.layout)).toBe(c.output);
    }
  });

  test("addBsDays (Date.AddDays)", () => {
    for (const c of cases.addDays) {
      if (c.error === "") {
        expect(formatBsDate(addBsDays(bs(c.bs), c.days))).toBe(c.result);
      } else {
        expectGoError(() => addBsDays(bs(c.bs), c.days), c.error);
      }
    }
  });

  test("daysBetweenBs (DaysBetween)", () => {
    for (const c of cases.daysBetween) {
      expect(daysBetweenBs(bs(c.from), bs(c.to))).toBe(c.days);
    }
  });

  test("toNepaliDigits / fromNepaliDigits", () => {
    for (const c of cases.digits) {
      expect(toNepaliDigits(c.input)).toBe(c.nepali);
      expect(fromNepaliDigits(c.input)).toBe(c.ascii);
    }
  });

  test("month names", () => {
    for (const c of cases.monthNames) {
      if (c.error === "") {
        expect(getBsMonthName(c.month)).toBe(c.name);
        expect(getBsMonthNameNepali(c.month)).toBe(c.nepali);
      } else {
        expectGoError(() => getBsMonthName(c.month), c.error);
        expectGoError(() => getBsMonthNameNepali(c.month), c.error);
      }
    }
  });
});

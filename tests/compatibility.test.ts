// Compatibility with the Go reference implementation, go-bs. The fixtures in
// tests/fixtures were produced by running the published go-bs module (see
// tools/go-reference); these tests never run Go themselves.

import { describe, expect, test } from "bun:test";
import conversions from "./fixtures/go-conversions.json";
import cases from "./fixtures/go-cases.json";
import monthsFixture from "./fixtures/go-months.json";
import {
  addBsDays,
  adToBs,
  bsToAd,
  daysBetweenBs,
  daysInBsMonth,
  endOfBsMonth,
  endOfBsYear,
  firstWeekdayOfBsMonth,
  formatBsDate,
  fromNepaliDigits,
  getBsAge,
  getBsDayOfWeek,
  getBsDayOfYear,
  getBsMonthCalendar,
  getBsMonthName,
  getBsMonthNameNepali,
  isValidBsDate,
  nextBsMonth,
  parseBsDate,
  previousBsMonth,
  startOfBsMonth,
  startOfBsYear,
  toNepaliDigits,
  weeksInBsMonth,
  type BSDate,
  type Weekday,
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

type MonthRow = [string, number, number, number[][], string, string, [number, string, string][]];

describe("month helpers match go-bs for all 1,464 months", () => {
  const rows = monthsFixture.months as MonthRow[];

  test("fixture is complete and from the expected go-bs release", () => {
    expect(monthsFixture.source).toBe(GO_SOURCE);
    expect(rows.length).toBe(1464);
    expect(monthsFixture.count).toBe(1464);
  });

  test("firstWeekdayOfBsMonth, weeksInBsMonth, getBsMonthCalendar, startOfBsMonth, endOfBsMonth", () => {
    for (const [ym, firstWeekday, weeks, grid, start, end] of rows) {
      const [year, month] = ym.split("-").map(Number) as [number, number];
      expect(firstWeekdayOfBsMonth(year, month)).toBe(firstWeekday as Weekday);
      expect(weeksInBsMonth(year, month)).toBe(weeks);
      const calendar = getBsMonthCalendar(year, month);
      expect(calendar.map((week) => week.map((cell) => cell?.day ?? 0))).toEqual(grid);
      for (const week of calendar) {
        for (const cell of week) {
          if (cell !== null) {
            expect([cell.year, cell.month]).toEqual([year, month]);
          }
        }
      }
      const mid = { year, month, day: 15 };
      expect(formatBsDate(startOfBsMonth(mid))).toBe(start);
      expect(formatBsDate(endOfBsMonth(mid))).toBe(end);
    }
  });

  test("nextBsMonth and previousBsMonth (NextMonth / PreviousMonth)", () => {
    const check = (fn: (d: BSDate) => BSDate, date: BSDate, expected: string) => {
      if (expected.startsWith("!")) {
        expectGoError(() => fn(date), expected.slice(1));
      } else {
        expect(formatBsDate(fn(date))).toBe(expected);
      }
    };
    let checked = 0;
    let expectedSteps = 0;
    for (const [ym, , , , , , steps] of rows) {
      const [year, month] = ym.split("-").map(Number) as [number, number];
      // Days 1, 28 and whichever of 29-32 exist in this month.
      expectedSteps += 2 + daysInBsMonth(year, month) - 28;
      for (const [day, next, previous] of steps) {
        check(nextBsMonth, { year, month, day }, next);
        check(previousBsMonth, { year, month, day }, previous);
        checked++;
      }
    }
    expect(checked).toBe(expectedSteps);
  });

  test("getBsDayOfYear (DayOfYear) for every supported date", () => {
    let mismatches = 0;
    for (const [bsString, , , dayOfYear] of conversions.days as [
      string,
      string,
      number,
      number,
    ][]) {
      if (getBsDayOfYear(bs(bsString)) !== dayOfYear) {
        mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  });
});

describe("more edge cases match go-bs", () => {
  test("startOfBsYear / endOfBsYear (StartOfYear / EndOfYear)", () => {
    for (const c of cases.yearBounds) {
      const date = { year: c.year, month: 1, day: 1 };
      if (c.error === "") {
        expect(formatBsDate(startOfBsYear(date))).toBe(c.start);
        expect(formatBsDate(endOfBsYear(date))).toBe(c.end);
      } else {
        expectGoError(() => startOfBsYear(date), c.error);
        expectGoError(() => endOfBsYear(date), c.error);
      }
    }
  });

  test("month helpers reject unsupported years and months the same way", () => {
    for (const c of cases.monthErrors) {
      const date = { year: c.year, month: c.month, day: 1 };
      expectGoError(() => startOfBsMonth(date), c.startOfMonth);
      expectGoError(() => endOfBsMonth(date), c.endOfMonth);
      expectGoError(() => firstWeekdayOfBsMonth(c.year, c.month), c.firstWeekday);
      expectGoError(() => weeksInBsMonth(c.year, c.month), c.weeksInMonth);
      expectGoError(() => getBsMonthCalendar(c.year, c.month), c.monthCalendar);
    }
  });

  test("getBsAge (Age)", () => {
    expect(cases.age.length).toBe(256);
    for (const c of cases.age) {
      if (c.error === "") {
        expect(getBsAge(bs(c.birth), bs(c.today))).toEqual({
          years: c.years,
          months: c.months,
          days: c.days,
        });
      } else {
        expectGoError(() => getBsAge(bs(c.birth), bs(c.today)), c.error);
      }
    }
  });
});

// Unit tests for the month, year, calendar-grid and age helpers, mostly
// ported from go-bs's arithmetic_test.go, calendar_test.go and age_test.go.
// tests/compatibility.test.ts checks them against go-bs for every month.

import { describe, expect, test } from "bun:test";
import {
  InvalidBSDateError,
  InvalidDateOrderError,
  daysInBsMonth,
  endOfBsMonth,
  endOfBsYear,
  firstWeekdayOfBsMonth,
  getBsAge,
  getBsDayOfWeek,
  getBsDayOfYear,
  getBsMonthCalendar,
  nextBsMonth,
  previousBsMonth,
  startOfBsMonth,
  startOfBsYear,
  todayBs,
  weeksInBsMonth,
  type BSDate,
} from "../src";
import { bs, forEachBsDate } from "./helpers";

function fieldOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidBSDateError);
    return (error as InvalidBSDateError).field;
  }
  throw new Error("expected InvalidBSDateError");
}

describe("nextBsMonth / previousBsMonth", () => {
  test("keep the day of the month", () => {
    expect(nextBsMonth(bs("2083-06-15"))).toEqual(bs("2083-07-15"));
    expect(previousBsMonth(bs("2083-06-15"))).toEqual(bs("2083-05-15"));
  });

  test("cross year boundaries", () => {
    expect(nextBsMonth(bs("2083-12-05"))).toEqual(bs("2084-01-05"));
    expect(previousBsMonth(bs("2083-01-05"))).toEqual(bs("2082-12-05"));
  });

  test("clamp to a shorter month instead of rolling over", () => {
    // Ashadh 2083 has 32 days, Shrawan 2083 has 31.
    expect(daysInBsMonth(2083, 3)).toBe(32);
    expect(nextBsMonth(bs("2083-03-32"))).toEqual({
      year: 2083,
      month: 4,
      day: daysInBsMonth(2083, 4),
    });
    expect(nextBsMonth(bs("2083-06-31"))).toEqual(bs("2083-07-30"));
    expect(previousBsMonth(bs("2083-01-31"))).toEqual(bs("2082-12-30"));
  });

  test("reject invalid dates, and results outside the range with field 'year' (like go-bs)", () => {
    expect(() => nextBsMonth(bs("2083-13-01"))).toThrow(InvalidBSDateError);
    expect(() => previousBsMonth(bs("2083-06-32"))).toThrow(InvalidBSDateError);
    expect(fieldOf(() => nextBsMonth(bs("2100-12-01")))).toBe("year");
    expect(fieldOf(() => previousBsMonth(bs("1979-01-15")))).toBe("year");
  });

  test("do not modify the argument", () => {
    const date = bs("2083-06-31");
    nextBsMonth(date);
    previousBsMonth(date);
    expect(date).toEqual(bs("2083-06-31"));
  });
});

describe("start and end of month and year", () => {
  const d = bs("2083-06-15");

  test("return the right days", () => {
    expect(startOfBsMonth(d)).toEqual(bs("2083-06-01"));
    expect(endOfBsMonth(d)).toEqual(bs("2083-06-31"));
    expect(startOfBsYear(d)).toEqual(bs("2083-01-01"));
    expect(endOfBsYear(d)).toEqual(bs("2083-12-30"));
    expect(endOfBsYear(bs("2100-01-01"))).toEqual(bs("2100-12-31"));
  });

  test("validate the whole date, including the day", () => {
    // go-bs's StartOfMonth/EndOfMonth/StartOfYear/EndOfYear only check the
    // year (and month); this package rejects an invalid day too.
    for (const fn of [startOfBsMonth, endOfBsMonth, startOfBsYear, endOfBsYear]) {
      expect(fieldOf(() => fn(bs("2083-13-01")))).toBe("month");
      expect(fieldOf(() => fn(bs("1978-01-01")))).toBe("year");
      expect(fieldOf(() => fn(bs("2083-06-32")))).toBe("day");
    }
  });
});

describe("getBsDayOfYear", () => {
  test("counts from Baisakh 1", () => {
    expect(getBsDayOfYear(bs("2083-01-01"))).toBe(1);
    expect(getBsDayOfYear(bs("2083-02-01"))).toBe(32);
    expect(getBsDayOfYear(bs("2083-12-30"))).toBe(365);
    expect(getBsDayOfYear(bs("2100-12-31"))).toBe(366);
  });

  test("increases by one each day and restarts at 1 every Baisakh 1", () => {
    let expected = 0;
    forEachBsDate((date) => {
      expected = date.month === 1 && date.day === 1 ? 1 : expected + 1;
      if (getBsDayOfYear(date) !== expected) {
        throw new Error(`getBsDayOfYear(${JSON.stringify(date)}) !== ${expected}`);
      }
    });
  });

  test("rejects invalid dates", () => {
    expect(() => getBsDayOfYear(bs("2083-13-01"))).toThrow(InvalidBSDateError);
  });
});

describe("calendar grid", () => {
  test("firstWeekdayOfBsMonth is the weekday of day 1", () => {
    expect(firstWeekdayOfBsMonth(2083, 6)).toBe(getBsDayOfWeek(bs("2083-06-01")));
    expect(firstWeekdayOfBsMonth(2083, 6)).toBe(4); // Thursday
    expect(fieldOf(() => firstWeekdayOfBsMonth(1978, 1))).toBe("year");
    expect(fieldOf(() => firstWeekdayOfBsMonth(2080, 13))).toBe("month");
  });

  test("getBsMonthCalendar lays out Ashwin 2083 Sunday-first", () => {
    const weeks = getBsMonthCalendar(2083, 6);
    expect(weeks.length).toBe(weeksInBsMonth(2083, 6));
    expect(weeks.map((week) => week.map((cell) => cell?.day ?? 0))).toEqual([
      [0, 0, 0, 0, 1, 2, 3],
      [4, 5, 6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15, 16, 17],
      [18, 19, 20, 21, 22, 23, 24],
      [25, 26, 27, 28, 29, 30, 31],
    ]);
    expect(weeks[0]?.[4]).toEqual(bs("2083-06-01"));
  });

  test("every month's grid has 7-cell weeks with each day once, in order, in its weekday column", () => {
    for (let year = 1979; year <= 2100; year++) {
      for (let month = 1; month <= 12; month++) {
        const weeks = getBsMonthCalendar(year, month);
        expect(weeks.length).toBe(weeksInBsMonth(year, month));
        const cells = weeks.flat();
        const days = cells.filter((cell): cell is BSDate => cell !== null);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
        expect(days.map((d) => d.day)).toEqual(
          Array.from({ length: daysInBsMonth(year, month) }, (_, i) => i + 1),
        );
        expect(cells.indexOf(days[0] ?? null)).toBe(firstWeekdayOfBsMonth(year, month));
        expect(weeks[0]?.some((cell) => cell !== null)).toBe(true);
        expect(weeks.at(-1)?.some((cell) => cell !== null)).toBe(true);
      }
    }
  });

  test("rejects invalid years and months", () => {
    expect(fieldOf(() => getBsMonthCalendar(2080, 0))).toBe("month");
    expect(fieldOf(() => weeksInBsMonth(1978, 1))).toBe("year");
  });
});

describe("getBsAge", () => {
  test("same date is zero", () => {
    const d = bs("2083-06-06");
    expect(getBsAge(d, d)).toEqual({ years: 0, months: 0, days: 0 });
  });

  test("exact years", () => {
    expect(getBsAge(bs("2060-06-15"), bs("2083-06-15"))).toEqual({
      years: 23,
      months: 0,
      days: 0,
    });
  });

  test("borrows days from the month before today's month", () => {
    // 5 days short of 23 years: the days come from Bhadra 2083.
    expect(getBsAge(bs("2060-06-15"), bs("2083-06-10"))).toEqual({
      years: 22,
      months: 11,
      days: daysInBsMonth(2083, 5) - 5,
    });
  });

  test("one month with no borrow, at the start of the range", () => {
    expect(getBsAge(bs("1979-01-01"), bs("1979-02-01"))).toEqual({
      years: 0,
      months: 1,
      days: 0,
    });
  });

  test("throws InvalidDateOrderError if birth is after today", () => {
    expect(() => getBsAge(bs("2083-06-10"), bs("2083-06-05"))).toThrow(InvalidDateOrderError);
    expect(() => getBsAge(bs("2083-06-10"), bs("2083-06-05"))).toThrow(RangeError);
  });

  test("rejects invalid dates", () => {
    expect(() => getBsAge(bs("2083-13-01"), bs("2083-06-06"))).toThrow(InvalidBSDateError);
    expect(() => getBsAge(bs("2083-06-06"), bs("2083-13-01"))).toThrow(InvalidBSDateError);
  });

  test("defaults today to todayBs()", () => {
    const birth = bs("2060-06-15");
    const before = getBsAge(birth, todayBs());
    const age = getBsAge(birth);
    const after = getBsAge(birth, todayBs());
    expect([before, after]).toContainEqual(age);
  });
});

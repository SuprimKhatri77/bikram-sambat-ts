import { describe, expect, test } from "bun:test";
import {
  InvalidBSDateError,
  daysInBsMonth,
  daysInBsYear,
  isSupportedBsYear,
  isValidBsDate,
  type BSDate,
} from "../src";

function fieldOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidBSDateError);
    expect(error).toBeInstanceOf(RangeError);
    return (error as InvalidBSDateError).field;
  }
  throw new Error("expected InvalidBSDateError, nothing was thrown");
}

// JavaScript numbers can be things a Go int never is.
const NON_INTEGERS = [Number.NaN, Infinity, -Infinity, 1.5, 2080.000001, -0.5];

describe("isValidBsDate", () => {
  test("accepts real dates, including each month's actual last day", () => {
    expect(isValidBsDate({ year: 2083, month: 6, day: 6 })).toBe(true);
    expect(isValidBsDate({ year: 1979, month: 1, day: 1 })).toBe(true);
    expect(isValidBsDate({ year: 2100, month: 12, day: 31 })).toBe(true);
    expect(isValidBsDate({ year: 2083, month: 3, day: 32 })).toBe(true);
  });

  test("rejects out-of-range and malformed components", () => {
    const invalid: BSDate[] = [
      { year: 1978, month: 1, day: 1 },
      { year: 2101, month: 1, day: 1 },
      { year: -2080, month: 1, day: 1 },
      { year: 2080, month: 0, day: 10 },
      { year: 2080, month: 13, day: 10 },
      { year: 2080, month: -1, day: 10 },
      { year: 2080, month: 1, day: 0 },
      { year: 2080, month: 1, day: -5 },
      { year: 2080, month: 1, day: 32 },
      // A day within 1..32 but beyond this particular month's length.
      { year: 2080, month: 8, day: daysInBsMonth(2080, 8) + 1 },
    ];
    for (const date of invalid) {
      expect(isValidBsDate(date)).toBe(false);
    }
  });

  test("rejects NaN, Infinity and fractional components", () => {
    for (const n of NON_INTEGERS) {
      expect(isValidBsDate({ year: n, month: 1, day: 1 })).toBe(false);
      expect(isValidBsDate({ year: 2080, month: n, day: 1 })).toBe(false);
      expect(isValidBsDate({ year: 2080, month: 1, day: n })).toBe(false);
    }
  });

  test("rejects non-number components and non-objects without throwing", () => {
    const values = [
      null,
      undefined,
      "2080-01-01",
      2080,
      {},
      { year: "2080", month: 1, day: 1 },
      { year: 2080, month: "1", day: 1 },
      { year: 2080, month: 1, day: 1n },
      { year: 2080, month: 1 },
    ];
    for (const value of values) {
      expect(isValidBsDate(value as unknown as BSDate)).toBe(false);
    }
  });
});

describe("daysInBsMonth / daysInBsYear / isSupportedBsYear", () => {
  test("return known values", () => {
    expect(daysInBsMonth(2083, 6)).toBe(31);
    expect(daysInBsMonth(2000, 1)).toBe(30);
    expect(daysInBsYear(2083)).toBe(365);
    expect(daysInBsYear(2100)).toBe(366);
    expect(isSupportedBsYear(1979)).toBe(true);
    expect(isSupportedBsYear(2100)).toBe(true);
    expect(isSupportedBsYear(1978)).toBe(false);
    expect(isSupportedBsYear(2101)).toBe(false);
  });

  test("reject invalid years and months with the right field", () => {
    expect(fieldOf(() => daysInBsMonth(1978, 1))).toBe("year");
    expect(fieldOf(() => daysInBsMonth(2101, 1))).toBe("year");
    expect(fieldOf(() => daysInBsMonth(2080, 0))).toBe("month");
    expect(fieldOf(() => daysInBsMonth(2080, 13))).toBe("month");
    expect(fieldOf(() => daysInBsYear(2101))).toBe("year");
    for (const n of NON_INTEGERS) {
      expect(isSupportedBsYear(n)).toBe(false);
      expect(fieldOf(() => daysInBsMonth(n, 1))).toBe("year");
      expect(fieldOf(() => daysInBsMonth(2080, n))).toBe("month");
      expect(fieldOf(() => daysInBsYear(n))).toBe("year");
    }
  });

  test("errors carry a useful message", () => {
    expect(() => daysInBsMonth(2101, 1)).toThrow(
      "bs: invalid year: 2101 (supported range 1979-2100)",
    );
    expect(() => daysInBsMonth(2080, 13)).toThrow("bs: invalid month: 13");
  });
});

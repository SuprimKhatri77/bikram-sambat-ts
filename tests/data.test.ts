import { describe, expect, test } from "bun:test";
import calendar from "../data/calendar.json";
import conversions from "./fixtures/go-conversions.json";
import { MAX_BS_YEAR, MIN_BS_YEAR, daysInBsMonth, daysInBsYear } from "../src";
import { CALENDAR_DATA, DATA_MAX_YEAR, DATA_MIN_YEAR } from "../src/data";

// A BS year has 365 or 366 days. go-bs's data (taken as-is from Hamro Patro
// for BS 2000-2100) has two exceptions, both in far-future projected years.
// They are reproduced here to stay identical to go-bs, and pinned so that
// any *new* anomaly fails this test. See "Known issues" in
// docs/calendar-data.md.
// Positional checksum of all 1,464 month lengths (see the last test).
const CHECKSUM = 413701637;

const KNOWN_ANOMALOUS_YEARS: Partial<Record<number, number>> = { 2087: 367, 2096: 364 };

describe("calendar data", () => {
  test("covers exactly BS 1979-2100", () => {
    expect(MIN_BS_YEAR).toBe(1979);
    expect(MAX_BS_YEAR).toBe(2100);
    expect(DATA_MIN_YEAR).toBe(MIN_BS_YEAR);
    expect(DATA_MAX_YEAR).toBe(MAX_BS_YEAR);
    expect(CALENDAR_DATA.length).toBe(122);
  });

  test("has 12 plausible months per year (1,464 months)", () => {
    let months = 0;
    CALENDAR_DATA.forEach((row, i) => {
      const year = MIN_BS_YEAR + i;
      expect(row.length).toBe(12);
      for (const days of row) {
        expect(Number.isInteger(days)).toBe(true);
        expect(days).toBeGreaterThanOrEqual(29);
        expect(days).toBeLessThanOrEqual(32);
        months++;
      }
      const total = daysInBsYear(year);
      expect(total).toBe(KNOWN_ANOMALOUS_YEARS[year] ?? (total === 366 ? 366 : 365));
    });
    expect(months).toBe(1464);
  });

  test("src/data.ts matches the canonical data/calendar.json exported from go-bs", () => {
    expect(calendar.source).toBe("github.com/suprimkhatri77/go-bs@v0.6.1");
    expect(calendar.minYear).toBe(MIN_BS_YEAR);
    expect(calendar.maxYear).toBe(MAX_BS_YEAR);
    const years = calendar.years as Record<string, number[]>;
    expect(Object.keys(years).length).toBe(122);
    for (let year = MIN_BS_YEAR; year <= MAX_BS_YEAR; year++) {
      const canonical = years[String(year)] ?? [];
      expect([...CALENDAR_DATA[year - MIN_BS_YEAR]]).toEqual(canonical);
      for (let month = 1; month <= 12; month++) {
        expect(daysInBsMonth(year, month)).toBe(canonical[month - 1] ?? Number.NaN);
      }
    }
  });

  test("has 44,562 supported days in total, like go-bs", () => {
    let total = 0;
    for (let year = MIN_BS_YEAR; year <= MAX_BS_YEAR; year++) {
      total += daysInBsYear(year);
    }
    expect(total).toBe(44562);
    expect(conversions.count).toBe(total);
  });

  test("totals match a fixed checksum of the dataset", () => {
    // A simple positional checksum over all 1,464 month lengths. If this
    // changes, the calendar data changed: that needs a cited source (see
    // docs/calendar-data.md) and regenerated fixtures, not just a new number.
    let checksum = 0;
    CALENDAR_DATA.forEach((row, i) =>
      row.forEach((days, m) => {
        checksum = (checksum * 31 + days * (i * 12 + m + 1)) % 1_000_000_007;
      }),
    );
    expect(checksum).toBe(CHECKSUM);
  });
});

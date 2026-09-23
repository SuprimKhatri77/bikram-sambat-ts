import { expect } from "bun:test";
import { daysInBsMonth, MAX_BS_YEAR, MIN_BS_YEAR, type BSDate } from "../src";

/** Formats a Date's local calendar components as "YYYY-MM-DD". */
export function localYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Builds a Date at local midnight from an AD "YYYY-MM-DD" string. */
export function localDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

/** Parses a BS "YYYY-MM-DD" string without going through the code under test. */
export function bs(ymd: string): BSDate {
  const [year, month, day] = ymd.split("-").map(Number) as [number, number, number];
  return { year, month, day };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Calls fn for every supported BS date, in order. */
export function forEachBsDate(fn: (date: BSDate) => void): number {
  let count = 0;
  for (let year = MIN_BS_YEAR; year <= MAX_BS_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      const days = daysInBsMonth(year, month);
      for (let day = 1; day <= days; day++) {
        fn({ year, month, day });
        count++;
      }
    }
  }
  return count;
}

/** Maps a go-bs error kind from the fixtures to this package's error check. */
export function expectGoError(fn: () => unknown, kind: string): void {
  const errorClass = {
    year: "InvalidBSDateError",
    month: "InvalidBSDateError",
    day: "InvalidBSDateError",
    format: "BSDateFormatError",
    outOfRange: "DateOutOfRangeError",
  }[kind];
  if (errorClass === undefined) {
    throw new Error(`unknown go-bs error kind ${kind}`);
  }
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error).name).toBe(errorClass);
  if (errorClass === "InvalidBSDateError") {
    expect((caught as { field: string }).field).toBe(kind);
  }
}

/**
 * AD dates in the supported range that don't exist as a local calendar day in
 * the current timezone, e.g. 1994-12-31 in Pacific/Kiritimati or 2011-12-30
 * in Pacific/Apia, which both skipped a whole day when moving across the
 * International Date Line. No Date can have such a day as its local date, so
 * bsToAd can't return one. Empty in almost every timezone.
 */
export const SKIPPED_LOCAL_DAYS: ReadonlySet<string> = (() => {
  const skipped = new Set<string>();
  const end = Date.UTC(2044, 3, 13);
  for (let t = Date.UTC(1922, 3, 13); t <= end; t += 86_400_000) {
    const utc = new Date(t);
    const ymd = utc.toISOString().slice(0, 10);
    if (localYmd(new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())) !== ymd) {
      skipped.add(ymd);
    }
  }
  return skipped;
})();

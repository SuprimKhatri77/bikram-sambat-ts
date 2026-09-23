import { MAX_BS_YEAR, MIN_BS_YEAR, MONTHS_PER_YEAR } from "./constants";
import { CALENDAR_DATA, type MonthLengths } from "./data";
import { InvalidBSDateError } from "./errors";
import type { BSDate } from "./types";

/**
 * Reports whether `year` is a Bikram Sambat year this package supports
 * (an integer from `MIN_BS_YEAR` to `MAX_BS_YEAR` inclusive).
 */
export function isSupportedBsYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_BS_YEAR && year <= MAX_BS_YEAR;
}

/**
 * Returns the number of days (29–32) in the given Bikram Sambat month.
 * `month` is 1-based (1 is Baisakh).
 *
 * @throws {InvalidBSDateError} If `year` is not a supported BS year or
 * `month` is not an integer from 1 to 12.
 */
export function daysInBsMonth(year: number, month: number): number {
  return monthLengths(year)[checkMonth(month)];
}

/**
 * Returns the total number of days (365 or 366 in the supported range) in the
 * given Bikram Sambat year.
 *
 * @throws {InvalidBSDateError} If `year` is not a supported BS year.
 */
export function daysInBsYear(year: number): number {
  let total = 0;
  for (const days of monthLengths(year)) {
    total += days;
  }
  return total;
}

/**
 * Reports whether `date` is a real Bikram Sambat calendar date within the
 * supported range. This checks each day against that month's actual length
 * in the calendar data, not just a generic 1–32 bound, and rejects
 * non-integer components (including `NaN` and `Infinity`). It never throws;
 * anything that isn't a valid `BSDate`, including `null`, returns `false`.
 */
export function isValidBsDate(date: BSDate): boolean {
  if (typeof date !== "object" || date === null) {
    return false;
  }
  const { year, month, day } = date;
  return (
    isSupportedBsYear(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= MONTHS_PER_YEAR &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= CALENDAR_DATA[year - MIN_BS_YEAR][month - 1]
  );
}

/**
 * Throws if `date` is not a valid BS date (see isValidBsDate), checking year,
 * then month, then day, so the error names the first bad component — the
 * same order go-bs's NewDate reports them in.
 *
 * @internal
 */
export function assertValidBsDate(date: BSDate): void {
  if (typeof date !== "object" || date === null) {
    throw new TypeError(
      `bs: expected a BSDate object, got ${date === null ? "null" : typeof date}`,
    );
  }
  const lengths = monthLengths(date.year);
  const maxDay = lengths[checkMonth(date.month)];
  const { day } = date;
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    throw new InvalidBSDateError(
      "day",
      `bs: invalid day: ${String(day)} (month ${date.month} of year ${date.year} has ${maxDay} days)`,
    );
  }
}

/** Returns the month lengths for `year`, or throws if it's unsupported. */
function monthLengths(year: number): MonthLengths {
  if (!isSupportedBsYear(year)) {
    throw new InvalidBSDateError(
      "year",
      `bs: invalid year: ${String(year)} (supported range ${MIN_BS_YEAR}-${MAX_BS_YEAR})`,
    );
  }
  return CALENDAR_DATA[year - MIN_BS_YEAR];
}

/** Returns the zero-based index of a 1-based `month`, or throws if invalid. */
function checkMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > MONTHS_PER_YEAR) {
    throw new InvalidBSDateError("month", `bs: invalid month: ${String(month)}`);
  }
  return month - 1;
}

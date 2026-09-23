import { MONTHS_PER_YEAR } from "./constants";
import { bsToDayNumber, dayNumberToBs } from "./convert";
import { DateOutOfRangeError } from "./errors";
import type { BSDate, Weekday } from "./types";
import { assertValidBsDate, daysInBsMonth } from "./validate";

/**
 * Returns the date `days` calendar days after `date` (or before it, if `days`
 * is negative). `date` itself is not modified.
 *
 * @example
 * addBsDays({ year: 2083, month: 6, day: 31 }, 1); // { year: 2083, month: 7, day: 1 }
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 * @throws {RangeError} If `days` is not an integer.
 * @throws {DateOutOfRangeError} If the result falls outside BS 1979–2100.
 */
export function addBsDays(date: BSDate, days: number): BSDate {
  const start = bsToDayNumber(date);
  if (!Number.isSafeInteger(days)) {
    throw new RangeError(`bs: days must be an integer, got ${String(days)}`);
  }
  const result = dayNumberToBs(start + days);
  if (result === undefined) {
    throw new DateOutOfRangeError(
      `bs: date outside supported range: ${days} days from ${formatIso(date)} is outside BS 1979-2100`,
    );
  }
  return result;
}

/**
 * Returns the date `days` calendar days before `date` (or after it, if
 * `days` is negative). Equivalent to `addBsDays(date, -days)`.
 *
 * @throws The same errors as {@link addBsDays}.
 */
export function subtractBsDays(date: BSDate, days: number): BSDate {
  return addBsDays(date, -days);
}

/**
 * Returns the number of calendar days from `from` to `to`: positive if `to`
 * is later, negative if it's earlier, and 0 if they're the same day. The
 * argument order matches go-bs's `DaysBetween(a, b)` (the result is `b − a`).
 *
 * @example
 * daysBetweenBs({ year: 2083, month: 1, day: 1 }, { year: 2083, month: 1, day: 11 }); // 10
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS date.
 */
export function daysBetweenBs(from: BSDate, to: BSDate): number {
  return bsToDayNumber(to) - bsToDayNumber(from);
}

/**
 * Returns the day of the week `date` falls on, numbered like
 * `Date#getDay()`: 0 is Sunday, 6 is Saturday.
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function getBsDayOfWeek(date: BSDate): Weekday {
  // Day 0 (1970-01-01) was a Thursday.
  return ((((bsToDayNumber(date) + 4) % 7) + 7) % 7) as Weekday;
}

function formatIso(date: BSDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

/**
 * Returns the date one BS month after `date`, on the same day of the month.
 * If the next month is shorter, the day is clamped to its last day instead of
 * rolling over (Ashwin 31 becomes Kartik 30, not Mangsir 1), like go-bs's
 * `NextMonth`.
 *
 * @example
 * nextBsMonth({ year: 2083, month: 6, day: 31 }); // { year: 2083, month: 7, day: 30 }
 * nextBsMonth({ year: 2083, month: 12, day: 15 }); // { year: 2084, month: 1, day: 15 }
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date, or
 * (with `field: "year"`, matching go-bs) if the result would be after BS 2100.
 */
export function nextBsMonth(date: BSDate): BSDate {
  assertValidBsDate(date);
  return date.month === MONTHS_PER_YEAR
    ? clampToMonth(date.year + 1, 1, date.day)
    : clampToMonth(date.year, date.month + 1, date.day);
}

/**
 * Returns the date one BS month before `date`, on the same day of the month,
 * clamped to that month's last day if it's shorter, like go-bs's
 * `PreviousMonth`.
 *
 * @example
 * previousBsMonth({ year: 2083, month: 1, day: 31 }); // { year: 2082, month: 12, day: 30 }
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date, or
 * (with `field: "year"`, matching go-bs) if the result would be before BS 1979.
 */
export function previousBsMonth(date: BSDate): BSDate {
  assertValidBsDate(date);
  return date.month === 1
    ? clampToMonth(date.year - 1, MONTHS_PER_YEAR, date.day)
    : clampToMonth(date.year, date.month - 1, date.day);
}

function clampToMonth(year: number, month: number, day: number): BSDate {
  return { year, month, day: Math.min(day, daysInBsMonth(year, month)) };
}

/**
 * Returns the first day of `date`'s month.
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function startOfBsMonth(date: BSDate): BSDate {
  assertValidBsDate(date);
  return { year: date.year, month: date.month, day: 1 };
}

/**
 * Returns the last day of `date`'s month (day 29–32, depending on the month).
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function endOfBsMonth(date: BSDate): BSDate {
  assertValidBsDate(date);
  return { year: date.year, month: date.month, day: daysInBsMonth(date.year, date.month) };
}

/**
 * Returns Baisakh 1 of `date`'s year.
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function startOfBsYear(date: BSDate): BSDate {
  assertValidBsDate(date);
  return { year: date.year, month: 1, day: 1 };
}

/**
 * Returns the last day of Chaitra in `date`'s year.
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function endOfBsYear(date: BSDate): BSDate {
  assertValidBsDate(date);
  return {
    year: date.year,
    month: MONTHS_PER_YEAR,
    day: daysInBsMonth(date.year, MONTHS_PER_YEAR),
  };
}

/**
 * Returns `date`'s day of the year: 1 for Baisakh 1, up to 365 or 366 for the
 * last day of Chaitra.
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function getBsDayOfYear(date: BSDate): number {
  return daysBetweenBs(startOfBsYear(date), date) + 1;
}

import { bsToDayNumber, dayNumberToBs } from "./convert";
import { DateOutOfRangeError } from "./errors";
import type { BSDate, Weekday } from "./types";

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

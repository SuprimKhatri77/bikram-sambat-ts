import { MONTHS_PER_YEAR } from "./constants";
import { compareBsDates } from "./compare";
import { InvalidDateOrderError } from "./errors";
import { todayBs } from "./today";
import type { BSDate } from "./types";
import { daysInBsMonth } from "./validate";

/** An age or other calendar duration, as returned by {@link getBsAge}. */
export interface BSAge {
  years: number;
  months: number;
  days: number;
}

/**
 * Returns the calendar age from `birth` to `today` in years, months and days,
 * counted in BS months, the way an age is stated in Nepal. `today` defaults
 * to today's date in Nepal ({@link todayBs}).
 *
 * The algorithm is go-bs's `Age`: subtract year, month and day separately;
 * if the days go negative, borrow the length of the month before `today`'s
 * month; if the months go negative, borrow 12 months from the years.
 *
 * @example
 * getBsAge({ year: 2060, month: 6, day: 15 }, { year: 2083, month: 6, day: 7 });
 * // { years: 22, months: 11, days: 23 }
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS date.
 * @throws {InvalidDateOrderError} If `birth` is after `today`.
 */
export function getBsAge(birth: BSDate, today: BSDate = todayBs()): BSAge {
  if (compareBsDates(birth, today) > 0) {
    throw new InvalidDateOrderError(
      `bs: invalid date order: birth date ${formatIso(birth)} is after reference date ${formatIso(today)}`,
    );
  }
  let years = today.year - birth.year;
  let months = today.month - birth.month;
  let days = today.day - birth.day;
  if (days < 0) {
    months--;
    const borrowYear = today.month === 1 ? today.year - 1 : today.year;
    const borrowMonth = today.month === 1 ? MONTHS_PER_YEAR : today.month - 1;
    days += daysInBsMonth(borrowYear, borrowMonth);
  }
  if (months < 0) {
    years--;
    months += MONTHS_PER_YEAR;
  }
  return { years, months, days };
}

function formatIso(date: BSDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

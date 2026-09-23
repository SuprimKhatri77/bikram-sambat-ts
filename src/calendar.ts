import { getBsDayOfWeek } from "./arithmetic";
import type { BSDate, Weekday } from "./types";
import { daysInBsMonth } from "./validate";

/**
 * Returns the day of the week (0 is Sunday) that day 1 of the given BS month
 * falls on.
 *
 * @throws {InvalidBSDateError} If `year` is not a supported BS year or
 * `month` is not an integer from 1 to 12.
 */
export function firstWeekdayOfBsMonth(year: number, month: number): Weekday {
  daysInBsMonth(year, month); // validates year and month
  return getBsDayOfWeek({ year, month, day: 1 });
}

/**
 * Returns how many rows (weeks, Sunday to Saturday) a calendar grid of the
 * given BS month needs: 5 or 6 in practice, and always the length of
 * {@link getBsMonthCalendar}'s result.
 *
 * @throws {InvalidBSDateError} If `year` is not a supported BS year or
 * `month` is not an integer from 1 to 12.
 */
export function weeksInBsMonth(year: number, month: number): number {
  return Math.ceil((firstWeekdayOfBsMonth(year, month) + daysInBsMonth(year, month)) / 7);
}

/**
 * Returns a week-by-week grid of the given BS month, for building calendar
 * UIs. Each week is an array of exactly 7 cells, Sunday first (as Nepali
 * calendars are usually laid out). A cell is `null` where no day of this
 * month falls: before day 1 in the first week and after the last day in the
 * last week. Every day of the month appears exactly once, in order. Matches
 * go-bs's `MonthCalendar`.
 *
 * @example
 * // Ashwin 2083 starts on a Thursday:
 * getBsMonthCalendar(2083, 6)[0];
 * // [null, null, null, null, { year: 2083, month: 6, day: 1 }, { ...day: 2 }, { ...day: 3 }]
 *
 * @throws {InvalidBSDateError} If `year` is not a supported BS year or
 * `month` is not an integer from 1 to 12.
 */
export function getBsMonthCalendar(year: number, month: number): (BSDate | null)[][] {
  const first = firstWeekdayOfBsMonth(year, month);
  const days = daysInBsMonth(year, month);
  const weeks: (BSDate | null)[][] = [];
  for (let cell = 0; cell < first + days; cell += 7) {
    const week: (BSDate | null)[] = [];
    for (let column = 0; column < 7; column++) {
      const day = cell + column - first + 1;
      week.push(day >= 1 && day <= days ? { year, month, day } : null);
    }
    weeks.push(week);
  }
  return weeks;
}

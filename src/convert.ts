import { MIN_BS_YEAR, MONTHS_PER_YEAR } from "./constants";
import { CALENDAR_DATA } from "./data";
import { DateOutOfRangeError } from "./errors";
import type { BSDate } from "./types";
import { assertValidBsDate } from "./validate";

/** @internal */
export const MS_PER_DAY = 86_400_000;

/**
 * Returns the number of days since 1970-01-01 of the given proleptic
 * Gregorian calendar date. `month` is zero-based, like Date#getMonth().
 *
 * setUTCFullYear is used rather than Date.UTC because Date.UTC maps years
 * 0–99 to 1900–1999, which would silently turn e.g. AD 0050 into AD 1950.
 *
 * @internal
 */
export function dayNumber(year: number, month: number, day: number): number {
  const t = new Date(0);
  t.setUTCFullYear(year, month, day);
  return Math.round(t.getTime() / MS_PER_DAY);
}

/**
 * The anchor for all conversions, the same verified pair go-bs uses:
 * BS 1979-01-01 (MIN_BS_YEAR Baisakh 1) is AD 1922-04-13.
 * See docs/calendar-data.md.
 */
const REFERENCE_DAY = /* @__PURE__ */ dayNumber(1922, 3, 13);

/**
 * YEAR_START[i] is the number of days from BS MIN_BS_YEAR-01-01 to the first
 * day of BS year MIN_BS_YEAR + i. It has one extra trailing entry, the total
 * number of supported days, so YEAR_START[i + 1] - YEAR_START[i] is always
 * the length of year i.
 */
const YEAR_START: readonly number[] = /* @__PURE__ */ buildYearStart();

function buildYearStart(): number[] {
  const starts = [0];
  let total = 0;
  for (const months of CALENDAR_DATA) {
    for (const days of months) {
      total += days;
    }
    starts.push(total);
  }
  return starts;
}

/**
 * Returns the number of days since 1970-01-01 of the Gregorian date that
 * `date` corresponds to. Validates `date` first.
 *
 * @internal
 */
export function bsToDayNumber(date: BSDate): number {
  assertValidBsDate(date);
  const yearIndex = date.year - MIN_BS_YEAR;
  const months = CALENDAR_DATA[yearIndex];
  let offset = YEAR_START[yearIndex];
  for (let m = 0; m < date.month - 1; m++) {
    offset += months[m];
  }
  return REFERENCE_DAY + offset + date.day - 1;
}

/**
 * Returns the BS date for a day number (days since 1970-01-01), or undefined
 * if it lies outside the supported range.
 *
 * @internal
 */
export function dayNumberToBs(day: number): BSDate | undefined {
  let remaining = day - REFERENCE_DAY;
  // The last YEAR_START entry is the total number of supported days.
  if (!(remaining >= 0 && remaining < YEAR_START[YEAR_START.length - 1])) {
    return undefined;
  }
  let yearIndex = 0;
  while (remaining >= YEAR_START[yearIndex + 1]) {
    yearIndex++;
  }
  remaining -= YEAR_START[yearIndex];
  const months = CALENDAR_DATA[yearIndex];
  let month = 0;
  while (month < MONTHS_PER_YEAR - 1 && remaining >= months[month]) {
    remaining -= months[month];
    month++;
  }
  return { year: MIN_BS_YEAR + yearIndex, month: month + 1, day: remaining + 1 };
}

/** Formats a day number as a Gregorian "YYYY-MM-DD" string, for messages. */
function formatDayNumber(day: number): string {
  const t = new Date(day * MS_PER_DAY);
  const year = t.getUTCFullYear();
  const yyyy = year < 0 ? `-${String(-year).padStart(6, "0")}` : String(year).padStart(4, "0");
  return `${yyyy}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Converts a Gregorian (AD) date to Bikram Sambat.
 *
 * Only the calendar date matters: the result depends on `date`'s local year,
 * month and day (`getFullYear()`, `getMonth()`, `getDate()`), and its
 * time-of-day is ignored. So `adToBs(new Date(2026, 8, 22))` and
 * `adToBs(new Date(2026, 8, 22, 23, 59))` both return BS 2083-06-06, in any
 * timezone. See the README's "Timezone behavior" section, in particular for
 * `new Date("2026-09-22")`, which JavaScript parses as UTC midnight rather
 * than local midnight.
 *
 * @example
 * adToBs(new Date(2026, 8, 22)); // { year: 2083, month: 6, day: 6 }
 *
 * @throws {TypeError} If `date` is not a `Date`, or is an Invalid Date.
 * @throws {DateOutOfRangeError} If the date is before AD 1922-04-13 or after
 * AD 2044-04-13 (the Gregorian equivalents of BS 1979-01-01 and 2100-12-31).
 */
export function adToBs(date: Date): BSDate {
  assertDate(date, "adToBs");
  return gregorianDayToBs(dayNumber(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Throws a TypeError unless `date` is a valid Date. `fn` names the public
 * function for the message.
 *
 * @internal
 */
export function assertDate(date: Date, fn: string): void {
  if (Object.prototype.toString.call(date) !== "[object Date]") {
    throw new TypeError(`bs: ${fn} expects a Date`);
  }
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`bs: ${fn} got an Invalid Date`);
  }
}

/**
 * Returns the BS date for a Gregorian day number (days since 1970-01-01), or
 * throws DateOutOfRangeError if it lies outside the supported range.
 *
 * @internal
 */
export function gregorianDayToBs(day: number): BSDate {
  const result = dayNumberToBs(day);
  if (result === undefined) {
    const side = day < REFERENCE_DAY ? "before the minimum" : "after the maximum";
    throw new DateOutOfRangeError(
      `bs: date outside supported range: ${formatDayNumber(day)} is ${side} supported date`,
    );
  }
  return result;
}

/**
 * Converts a Bikram Sambat date to the corresponding Gregorian (AD) date.
 *
 * The result is a new `Date` at local midnight of that Gregorian day, so its
 * `getFullYear()`, `getMonth()` and `getDate()` give the AD calendar date, and
 * passing it back to {@link adToBs} returns the original BS date.
 *
 * @example
 * bsToAd({ year: 2083, month: 6, day: 6 }); // local midnight, 22 September 2026
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 * @throws {TypeError} If `date` is not an object.
 */
export function bsToAd(date: BSDate): Date {
  const t = new Date(bsToDayNumber(date) * MS_PER_DAY);
  return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

// prettier-ignore
const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

// Spelled as Hamro Patro's calendar spells them (its weekday column headers),
// the same source as the Nepali month names and the same spelling as go-bs.
// Nepal Academy's standard spelling uses -बार instead (e.g. "आइतबार").
// prettier-ignore
const WEEKDAY_NAMES_NEPALI = [
  "आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहिवार", "शुक्रवार", "शनिवार",
] as const;

/**
 * Short Nepali weekday names, used by formatBsDate's `ddd` token in Nepali
 * mode: each full name without its "वार" suffix.
 *
 * @internal
 */
// prettier-ignore
export const WEEKDAY_SHORT_NAMES_NEPALI = [
  "आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि",
] as const;

/**
 * Returns the English name of a weekday numbered like `Date#getDay()` and
 * {@link getBsDayOfWeek} (0 is `"Sunday"`, 6 is `"Saturday"`).
 *
 * @throws {RangeError} If `weekday` is not an integer from 0 to 6.
 */
export function getBsWeekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekdayIndex(weekday)];
}

/**
 * Returns the Nepali (Devanagari) name of a weekday numbered like
 * `Date#getDay()` (0 is `"आइतवार"`, 6 is `"शनिवार"`), spelled as Hamro
 * Patro's calendar spells it, like go-bs's `WeekdayNameNepali`.
 *
 * @example
 * getBsWeekdayNameNepali(getBsDayOfWeek({ year: 2083, month: 6, day: 7 })); // "बुधवार"
 *
 * @throws {RangeError} If `weekday` is not an integer from 0 to 6.
 */
export function getBsWeekdayNameNepali(weekday: number): string {
  return WEEKDAY_NAMES_NEPALI[weekdayIndex(weekday)];
}

function weekdayIndex(weekday: number): number {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new RangeError(`bs: invalid weekday: ${String(weekday)}`);
  }
  return weekday;
}

import type { BSDate } from "./types";
import { assertValidBsDate } from "./validate";

/**
 * Compares two BS dates: returns -1 if `a` is earlier than `b`, 0 if they're
 * the same day, and 1 if `a` is later. Suitable as an `Array#sort`
 * comparator.
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS
 * date. (go-bs's `Compare` compares fields without validating; this package
 * validates so that `NaN` or fractional fields can't produce a misleading
 * answer.)
 */
export function compareBsDates(a: BSDate, b: BSDate): -1 | 0 | 1 {
  assertValidBsDate(a);
  assertValidBsDate(b);
  if (a.year !== b.year) {
    return a.year < b.year ? -1 : 1;
  }
  if (a.month !== b.month) {
    return a.month < b.month ? -1 : 1;
  }
  if (a.day !== b.day) {
    return a.day < b.day ? -1 : 1;
  }
  return 0;
}

/**
 * Reports whether `a` is earlier than `b`.
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS date.
 */
export function isBeforeBs(a: BSDate, b: BSDate): boolean {
  return compareBsDates(a, b) < 0;
}

/**
 * Reports whether `a` is later than `b`.
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS date.
 */
export function isAfterBs(a: BSDate, b: BSDate): boolean {
  return compareBsDates(a, b) > 0;
}

/**
 * Reports whether `a` and `b` are the same calendar day. Unlike `a === b`,
 * this compares the year, month and day values rather than object identity.
 *
 * @throws {InvalidBSDateError} If either date is not a real, supported BS date.
 */
export function isEqualBs(a: BSDate, b: BSDate): boolean {
  return compareBsDates(a, b) === 0;
}

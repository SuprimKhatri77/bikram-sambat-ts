/**
 * A Bikram Sambat calendar date.
 *
 * `month` is 1-based: 1 is Baisakh and 12 is Chaitra. This is deliberately
 * different from JavaScript's zero-based `Date#getMonth()`.
 *
 * A `BSDate` is a plain object, so nothing stops you building an invalid one
 * such as `{ year: 2083, month: 13, day: 1 }`. Every function in this package
 * that takes a `BSDate` validates it first (see {@link isValidBsDate}).
 */
export interface BSDate {
  year: number;
  month: number;
  day: number;
}

/** A day of the week, numbered like `Date#getDay()`: 0 is Sunday, 6 is Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

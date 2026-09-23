/** Which component of a {@link BSDate} made it invalid. */
export type InvalidBSDateField = "year" | "month" | "day";

/**
 * Thrown when a Bikram Sambat date (or a year or month on its own) is not a
 * real, supported calendar date: the year is outside
 * `MIN_BS_YEAR`–`MAX_BS_YEAR`, the month is outside 1–12, the day is beyond
 * that month's actual length, or a component is not an integer (including
 * `NaN` and `Infinity`).
 *
 * `field` says which component was rejected; it corresponds to go-bs's
 * `ErrInvalidYear`, `ErrInvalidMonth` and `ErrInvalidDay`.
 */
export class InvalidBSDateError extends RangeError {
  readonly field: InvalidBSDateField;

  constructor(field: InvalidBSDateField, message: string) {
    super(message);
    this.name = "InvalidBSDateError";
    this.field = field;
  }
}

/**
 * Thrown when a Gregorian date, or the result of date arithmetic, falls
 * outside the range this package supports (BS 1979-01-01 to BS 2100-12-31,
 * i.e. AD 1922-04-13 to AD 2044-04-13). Corresponds to go-bs's
 * `ErrOutOfRange`.
 */
export class DateOutOfRangeError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "DateOutOfRangeError";
  }
}

/**
 * Thrown by {@link parseBsDate} when a string is not shaped like
 * `"YYYY-MM-DD"`. A correctly shaped string naming a date that doesn't exist
 * (e.g. `"2083-13-01"`) throws {@link InvalidBSDateError} instead. Corresponds
 * to go-bs's `ErrInvalidFormat`.
 */
export class BSDateFormatError extends SyntaxError {
  /** The string that failed to parse. */
  readonly input: string;

  constructor(input: string, message: string) {
    super(message);
    this.name = "BSDateFormatError";
    this.input = input;
  }
}

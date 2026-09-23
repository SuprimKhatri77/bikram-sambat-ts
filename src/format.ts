import { getBsDayOfWeek } from "./arithmetic";
import { BSDateFormatError } from "./errors";
import { getBsMonthName } from "./months";
import type { BSDate } from "./types";
import { assertValidBsDate } from "./validate";

// prettier-ignore
const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

// Longer tokens come before any shorter token that is a prefix of them
// ("YYYY" before "YY"), so the first match at each position is the longest.
const TOKENS = ["YYYY", "MMMM", "dddd", "ddd", "DD", "MM", "YY", "D", "M"] as const;
type Token = (typeof TOKENS)[number];

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Formats a BS date. With no `layout` it returns `"YYYY-MM-DD"`, the form
 * {@link parseBsDate} accepts. Otherwise these tokens are replaced (the same
 * set, and the same longest-match-first rule, as go-bs's `Date.Format`):
 *
 * | Token  | Output                           | Example      |
 * | ------ | -------------------------------- | ------------ |
 * | `YYYY` | 4-digit year                     | `2083`       |
 * | `YY`   | 2-digit year                     | `83`         |
 * | `MMMM` | English month name               | `Ashwin`     |
 * | `MM`   | month, zero-padded               | `06`         |
 * | `M`    | month                            | `6`          |
 * | `DD`   | day, zero-padded                 | `06`         |
 * | `D`    | day                              | `6`          |
 * | `dddd` | English weekday name             | `Tuesday`    |
 * | `ddd`  | 3-letter weekday                 | `Tue`        |
 *
 * Every other character is copied through as-is. There is no escaping, so a
 * literal `D` or `M` in `layout` is always treated as a token.
 *
 * @example
 * formatBsDate({ year: 2083, month: 6, day: 6 }); // "2083-06-06"
 * formatBsDate({ year: 2083, month: 6, day: 6 }, "dddd, MMMM D, YYYY"); // "Tuesday, Ashwin 6, 2083"
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function formatBsDate(date: BSDate, layout = "YYYY-MM-DD"): string {
  assertValidBsDate(date);
  const { year, month, day } = date;
  let weekday: string | undefined;
  const value = (token: Token): string => {
    switch (token) {
      case "YYYY":
        return String(year);
      case "YY":
        return pad2(year % 100);
      case "MMMM":
        return getBsMonthName(month);
      case "MM":
        return pad2(month);
      case "M":
        return String(month);
      case "DD":
        return pad2(day);
      case "D":
        return String(day);
      case "dddd":
        return (weekday ??= WEEKDAY_NAMES[getBsDayOfWeek(date)]);
      case "ddd":
        return (weekday ??= WEEKDAY_NAMES[getBsDayOfWeek(date)]).slice(0, 3);
    }
  };

  let out = "";
  for (let i = 0; i < layout.length;) {
    const token = TOKENS.find((t) => layout.startsWith(t, i));
    if (token === undefined) {
      out += layout[i];
      i++;
    } else {
      out += value(token);
      i += token.length;
    }
  }
  return out;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a BS date in `"YYYY-MM-DD"` form (zero-padded, ASCII digits, nothing
 * before or after), the form {@link formatBsDate} produces by default. For
 * Devanagari digits, convert with {@link fromNepaliDigits} first.
 *
 * @example
 * parseBsDate("2083-06-06"); // { year: 2083, month: 6, day: 6 }
 *
 * @throws {BSDateFormatError} If `value` is not shaped like `"YYYY-MM-DD"`.
 * @throws {InvalidBSDateError} If it is shaped correctly but isn't a real,
 * supported BS date (e.g. `"2083-13-01"`).
 * @throws {TypeError} If `value` is not a string.
 */
export function parseBsDate(value: string): BSDate {
  if (typeof value !== "string") {
    throw new TypeError(`bs: parseBsDate expects a string, got ${typeof value}`);
  }
  const match = DATE_PATTERN.exec(value);
  if (match === null) {
    throw new BSDateFormatError(
      value,
      `bs: invalid date format: ${JSON.stringify(value)} (want YYYY-MM-DD)`,
    );
  }
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  assertValidBsDate(date);
  return date;
}

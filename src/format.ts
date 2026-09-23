import { getBsDayOfWeek } from "./arithmetic";
import { toNepaliDigits } from "./digits";
import { BSDateFormatError } from "./errors";
import { getBsMonthName, getBsMonthNameNepali } from "./months";
import type { BSDate } from "./types";
import { assertValidBsDate } from "./validate";
import { WEEKDAY_SHORT_NAMES_NEPALI, getBsWeekdayName, getBsWeekdayNameNepali } from "./weekdays";

/** Options for {@link formatBsDate}. */
export interface FormatBsDateOptions {
  /**
   * Render in Nepali: numbers in Devanagari digits, and month and weekday
   * names in Nepali. Default `false`.
   */
  nepali?: boolean;
}

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
 * | Token  | Output                    | English     | `nepali: true` |
 * | ------ | ------------------------- | ----------- | -------------- |
 * | `YYYY` | 4-digit year              | `2083`      | `२०८३`         |
 * | `YY`   | 2-digit year              | `83`        | `८३`           |
 * | `MMMM` | month name                | `Ashwin`    | `असोज`         |
 * | `MM`   | month, zero-padded        | `06`        | `०६`           |
 * | `M`    | month                     | `6`         | `६`            |
 * | `DD`   | day, zero-padded          | `07`        | `०७`           |
 * | `D`    | day                       | `7`         | `७`            |
 * | `dddd` | weekday name              | `Wednesday` | `बुधवार`       |
 * | `ddd`  | short weekday name        | `Wed`       | `बुध`          |
 *
 * Every other character is copied through as-is, including ASCII digits in
 * Nepali mode. There is no escaping, so a literal `D` or `M` in `layout` is
 * always treated as a token. `{ nepali: true }` matches go-bs's
 * `Date.FormatNepali`.
 *
 * @example
 * const d = { year: 2083, month: 6, day: 7 };
 * formatBsDate(d); // "2083-06-07"
 * formatBsDate(d, "dddd, MMMM D, YYYY"); // "Wednesday, Ashwin 7, 2083"
 * formatBsDate(d, { nepali: true }); // "२०८३-०६-०७"
 * formatBsDate(d, "dddd, MMMM D, YYYY", { nepali: true }); // "बुधवार, असोज ७, २०८३"
 *
 * @throws {InvalidBSDateError} If `date` is not a real, supported BS date.
 */
export function formatBsDate(date: BSDate, options?: FormatBsDateOptions): string;
export function formatBsDate(date: BSDate, layout?: string, options?: FormatBsDateOptions): string;
export function formatBsDate(
  date: BSDate,
  layoutOrOptions?: string | FormatBsDateOptions,
  options?: FormatBsDateOptions,
): string {
  const layout = typeof layoutOrOptions === "string" ? layoutOrOptions : "YYYY-MM-DD";
  const opts =
    typeof layoutOrOptions === "object" && layoutOrOptions !== null ? layoutOrOptions : options;
  const nepali = opts?.nepali === true;
  assertValidBsDate(date);
  const { year, month, day } = date;
  const digits = nepali ? toNepaliDigits : String;
  let weekday: number | undefined;
  const dayOfWeek = (): number => (weekday ??= getBsDayOfWeek(date));
  const value = (token: Token): string => {
    switch (token) {
      case "YYYY":
        return digits(String(year));
      case "YY":
        return digits(pad2(year % 100));
      case "MMMM":
        return nepali ? getBsMonthNameNepali(month) : getBsMonthName(month);
      case "MM":
        return digits(pad2(month));
      case "M":
        return digits(String(month));
      case "DD":
        return digits(pad2(day));
      case "D":
        return digits(String(day));
      case "dddd":
        return nepali ? getBsWeekdayNameNepali(dayOfWeek()) : getBsWeekdayName(dayOfWeek());
      case "ddd":
        return nepali
          ? WEEKDAY_SHORT_NAMES_NEPALI[dayOfWeek()]
          : getBsWeekdayName(dayOfWeek()).slice(0, 3);
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

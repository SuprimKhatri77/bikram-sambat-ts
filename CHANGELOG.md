# Changelog

This project follows [Semantic Versioning](https://semver.org/). While it's
below 1.0.0, minor versions may still change the API.

## 0.3.0 - Unreleased

Based on go-bs v0.7.0.

Nepali formatting:

- `formatBsDate(date, layout?, { nepali: true })` (or
  `formatBsDate(date, { nepali: true })`): the same layout tokens rendered in
  Nepali, with Devanagari digits, Nepali month names (`MMMM`), Nepali weekday
  names (`dddd`) and short weekday names (`ddd`), e.g. "बुधवार, असोज ७, २०८३".
  Matches go-bs's `Date.FormatNepali`. The new `FormatBsDateOptions` type
  describes the options.
- `getBsWeekdayName`, `getBsWeekdayNameNepali`: weekday names for a
  `Date#getDay()`-style number. The Nepali names follow Hamro Patro's spelling
  (आइतवार … शनिवार), like go-bs.

The rest of go-bs's date helpers, checked against go-bs for every supported
month:

- `nextBsMonth` / `previousBsMonth`: one BS month later or earlier, clamping
  the day to the target month's last day
- `startOfBsMonth`, `endOfBsMonth`, `startOfBsYear`, `endOfBsYear`
- `getBsDayOfYear`
- `getBsAge(birth, today?)`: age in years, months and days (`today` defaults
  to `todayBs()`), plus the `BSAge` type and a new `InvalidDateOrderError`
- Calendar grid: `getBsMonthCalendar` (Sunday-first weeks, `null` for empty
  cells), `weeksInBsMonth`, `firstWeekdayOfBsMonth`

## 0.2.0 - 2026-09-23

- `todayBs(now?: Date)`: today's date in Nepal (Nepal Standard Time,
  UTC+05:45) as a BS date, whatever the runtime's timezone. Unlike
  `adToBs(new Date())`, it gives the right day on servers running in UTC
  during the 5 h 45 min after midnight in Nepal. Matches go-bs's `TodayBS`.

## 0.1.0 - 2026-09-23

Initial release, based on go-bs v0.6.1.

- `adToBs` / `bsToAd` conversion for BS 1979–2100 (AD 1922-04-13 to
  2044-04-13)
- Validation: `isValidBsDate`, `isSupportedBsYear`, `daysInBsMonth`,
  `daysInBsYear`, with explicit handling of `NaN`, `Infinity`, fractional
  values and `Invalid Date`
- Arithmetic and comparison: `addBsDays`, `subtractBsDays`, `daysBetweenBs`,
  `getBsDayOfWeek`, `compareBsDates`, `isBeforeBs`, `isAfterBs`, `isEqualBs`
- `formatBsDate` (go-bs's layout tokens) and `parseBsDate`
- `getBsMonthName`, `getBsMonthNameNepali`, `toNepaliDigits`,
  `fromNepaliDigits`
- Typed errors: `InvalidBSDateError`, `DateOutOfRangeError`,
  `BSDateFormatError`
- Static, offline calendar data exported from go-bs, zero runtime
  dependencies
- ESM and CommonJS builds with type declarations, tree-shakable
- Tests: exhaustive round trips over every supported day, go-bs comparison
  fixtures for every day plus edge cases, and runs in 9 timezones

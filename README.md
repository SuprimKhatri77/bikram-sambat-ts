# bikram-sambat-ts

A lightweight, dependency-free TypeScript library for converting dates between
Gregorian (AD) and Bikram Sambat (BS), the calendar used in Nepal.

It's the TypeScript sibling of the Go package
[go-bs](https://github.com/suprimkhatri77/go-bs). It uses the same calendar
dataset and the same reference date, and it's tested to give the same result
as go-bs for every one of the 44,562 supported days.

```text
✓ BS 1979–2100 (AD 1922-04-13 to 2044-04-13)
✓ 122 BS years, 1,464 BS months
✓ Every supported date checked against go-bs, in both directions
✓ Zero runtime dependencies, zero network requests
✓ ESM + CommonJS + type declarations, tree-shakable (~3.5 KB gzipped in total)
```

## Features

- `adToBs` / `bsToAd` conversion
- Strict validation against real BS month lengths (not just a 1–32 check),
  including `NaN`, `Infinity`, fractional values and `Invalid Date`
- Day arithmetic and comparison, month and year helpers, age, and a
  calendar-grid builder for calendar UIs
- Formatting and parsing, in English or Nepali (Devanagari digits, Nepali
  month and weekday names)
- TypeScript-first, strict types, no `any`
- Works in Node.js, Bun, Deno, browsers, React, Next.js and Vite. There are no
  Node-only APIs in the library code.
- Works fully offline: the calendar data is a static table in the package

## Installation

```sh
npm install bikram-sambat-ts
# or
pnpm add bikram-sambat-ts
yarn add bikram-sambat-ts
bun add bikram-sambat-ts
```

## Usage

### AD → BS

```ts
import { adToBs } from "bikram-sambat-ts";

// JavaScript months are zero-based: 8 is September.
adToBs(new Date(2026, 8, 22)); // { year: 2083, month: 6, day: 6 }

// Today's BS date, for the device's local calendar day.
adToBs(new Date());
```

### Today in Nepal

```ts
import { todayBs } from "bikram-sambat-ts";

todayBs(); // today's BS date in Nepal (UTC+05:45), whatever the runtime's timezone
todayBs(new Date("2026-09-22T20:00:00Z")); // { year: 2083, month: 6, day: 7 }
```

Use `todayBs()` on servers, where "today" should mean today in Nepal. In a
browser, `adToBs(new Date())` gives the user's own calendar day, which is the
same thing for users in Nepal. See [Timezone behavior](#timezone-behavior).

### BS → AD

BS months are **one-based**: 1 is Baisakh and 12 is Chaitra.

```ts
import { bsToAd } from "bikram-sambat-ts";

const ad = bsToAd({ year: 2083, month: 6, day: 6 });
ad.toDateString(); // "Tue Sep 22 2026"
```

`bsToAd` returns a new `Date` at local midnight of that AD day.

### Validation

```ts
import { daysInBsMonth, daysInBsYear, isSupportedBsYear, isValidBsDate } from "bikram-sambat-ts";

isValidBsDate({ year: 2083, month: 2, day: 32 }); // false: Jestha 2083 has 31 days
isValidBsDate({ year: 2083, month: 3, day: 32 }); // true: Ashadh 2083 has 32
daysInBsMonth(2083, 6); // 31
daysInBsYear(2083); // 365
isSupportedBsYear(2101); // false
```

`isValidBsDate` never throws. The other functions throw on invalid input (see
[Errors](#errors)).

### Arithmetic and comparison

```ts
import {
  addBsDays,
  compareBsDates,
  daysBetweenBs,
  getBsDayOfWeek,
  isAfterBs,
  isBeforeBs,
  isEqualBs,
  subtractBsDays,
} from "bikram-sambat-ts";

const d = { year: 2083, month: 6, day: 6 };

addBsDays(d, 10); // { year: 2083, month: 6, day: 16 }
subtractBsDays(d, 10); // { year: 2083, month: 5, day: 27 }
daysBetweenBs(d, { year: 2083, month: 6, day: 16 }); // 10 (second minus first)
getBsDayOfWeek(d); // 2 (Tuesday; 0 is Sunday, like Date#getDay)

isBeforeBs(d, addBsDays(d, 1)); // true
isAfterBs(d, addBsDays(d, 1)); // false
isEqualBs(d, { year: 2083, month: 6, day: 6 }); // true
[d, addBsDays(d, -1)].sort(compareBsDates); // oldest first
```

### Months, years and age

```ts
import {
  endOfBsMonth,
  endOfBsYear,
  getBsAge,
  getBsDayOfYear,
  nextBsMonth,
  previousBsMonth,
  startOfBsMonth,
  startOfBsYear,
} from "bikram-sambat-ts";

const d = { year: 2083, month: 6, day: 31 };

nextBsMonth(d); // { year: 2083, month: 7, day: 30 } (Kartik has 30 days, so the day is clamped)
previousBsMonth(d); // { year: 2083, month: 5, day: 31 }
startOfBsMonth(d); // { year: 2083, month: 6, day: 1 }
endOfBsMonth(d); // { year: 2083, month: 6, day: 31 }
startOfBsYear(d); // { year: 2083, month: 1, day: 1 }
endOfBsYear(d); // { year: 2083, month: 12, day: 30 }
getBsDayOfYear(d); // 187

getBsAge({ year: 2060, month: 6, day: 15 }, { year: 2083, month: 6, day: 7 });
// { years: 22, months: 11, days: 23 }
getBsAge({ year: 2060, month: 6, day: 15 }); // age as of today in Nepal
```

`nextBsMonth`/`previousBsMonth` clamp to the target month's last day rather
than rolling over, like go-bs's `NextMonth`/`PreviousMonth`.

### Calendar grid

```ts
import { firstWeekdayOfBsMonth, getBsMonthCalendar, weeksInBsMonth } from "bikram-sambat-ts";

firstWeekdayOfBsMonth(2083, 6); // 4 (Thursday)
weeksInBsMonth(2083, 6); // 5

// Weeks run Sunday to Saturday; null means no day of this month in that cell.
for (const week of getBsMonthCalendar(2083, 6)) {
  console.log(week.map((cell) => (cell ? String(cell.day).padStart(2) : "  ")).join(" "));
}
//              1  2  3
//  4  5  6  7  8  9 10
// 11 12 13 14 15 16 17
// 18 19 20 21 22 23 24
// 25 26 27 28 29 30 31
```

### Formatting and parsing

```ts
import { formatBsDate, parseBsDate, todayBs } from "bikram-sambat-ts";

const d = { year: 2083, month: 6, day: 7 };

formatBsDate(d); // "2083-06-07"
formatBsDate(d, "dddd, MMMM D, YYYY"); // "Wednesday, Ashwin 7, 2083"
parseBsDate("2083-06-15"); // { year: 2083, month: 6, day: 15 }

// In Nepali: Devanagari digits, Nepali month and weekday names
formatBsDate(d, { nepali: true }); // "२०८३-०६-०७"
formatBsDate(d, "dddd, MMMM D, YYYY", { nepali: true }); // "बुधवार, असोज ७, २०८३"

// Today's date in Nepal, in Nepali
formatBsDate(todayBs(), "dddd, MMMM D, YYYY", { nepali: true });
```

The layout tokens are the same as go-bs's `Date.Format`, and
`{ nepali: true }` matches go-bs's `Date.FormatNepali`:

| Token  | Output             | English     | `nepali: true` |
| ------ | ------------------ | ----------- | -------------- |
| `YYYY` | 4-digit year       | `2083`      | `२०८३`         |
| `YY`   | 2-digit year       | `83`        | `८३`           |
| `MMMM` | month name         | `Ashwin`    | `असोज`         |
| `MM`   | month, zero-padded | `06`        | `०६`           |
| `M`    | month              | `6`         | `६`            |
| `DD`   | day, zero-padded   | `07`        | `०७`           |
| `D`    | day                | `7`         | `७`            |
| `dddd` | weekday name       | `Wednesday` | `बुधवार`       |
| `ddd`  | short weekday name | `Wed`       | `बुध`          |

Any other character is copied as-is, including ASCII digits in Nepali mode.
There's no escaping, so a literal `D` or `M` in the layout is always treated as
a token. `parseBsDate` accepts only `YYYY-MM-DD` (zero-padded, ASCII digits);
for Nepali digits, convert with `fromNepaliDigits` first.

The Nepali weekday names follow Hamro Patro's calendar (आइतवार, सोमवार,
मंगलवार, बुधवार, बिहिवार, शुक्रवार, शनिवार), the same source as the month
names. The short forms drop "वार" (आइत, सोम, …). The Nepal Academy standard
spelling uses -बार instead (आइतबार, …); both are in common use.

### Month and weekday names, Nepali digits

```ts
import {
  fromNepaliDigits,
  getBsMonthName,
  getBsMonthNameNepali,
  getBsWeekdayName,
  getBsWeekdayNameNepali,
  toNepaliDigits,
} from "bikram-sambat-ts";

getBsMonthName(6); // "Ashwin"
getBsMonthNameNepali(6); // "असोज"
getBsWeekdayName(3); // "Wednesday"
getBsWeekdayNameNepali(3); // "बुधवार"
toNepaliDigits("2083-06-06"); // "२०८३-०६-०६"
toNepaliDigits(2083); // "२०८३"
fromNepaliDigits("२०८३-०६-०६"); // "2083-06-06"
```

## API

```ts
const MIN_BS_YEAR: 1979;
const MAX_BS_YEAR: 2100;

interface BSDate { year: number; month: number; day: number } // month 1-12
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

adToBs(date: Date): BSDate
bsToAd(date: BSDate): Date
todayBs(now?: Date): BSDate // today in Nepal (UTC+05:45)

isValidBsDate(date: BSDate): boolean
isSupportedBsYear(year: number): boolean
daysInBsMonth(year: number, month: number): number
daysInBsYear(year: number): number

addBsDays(date: BSDate, days: number): BSDate
subtractBsDays(date: BSDate, days: number): BSDate
daysBetweenBs(from: BSDate, to: BSDate): number // to − from
getBsDayOfWeek(date: BSDate): Weekday
getBsDayOfYear(date: BSDate): number

nextBsMonth(date: BSDate): BSDate // clamps the day to the target month
previousBsMonth(date: BSDate): BSDate
startOfBsMonth(date: BSDate): BSDate
endOfBsMonth(date: BSDate): BSDate
startOfBsYear(date: BSDate): BSDate
endOfBsYear(date: BSDate): BSDate
getBsAge(birth: BSDate, today?: BSDate): BSAge // { years, months, days }; today defaults to todayBs()

firstWeekdayOfBsMonth(year: number, month: number): Weekday
weeksInBsMonth(year: number, month: number): number
getBsMonthCalendar(year: number, month: number): (BSDate | null)[][] // Sunday-first weeks

compareBsDates(a: BSDate, b: BSDate): -1 | 0 | 1
isBeforeBs(a: BSDate, b: BSDate): boolean
isAfterBs(a: BSDate, b: BSDate): boolean
isEqualBs(a: BSDate, b: BSDate): boolean

formatBsDate(date: BSDate, layout?: string, options?: { nepali?: boolean }): string // default "YYYY-MM-DD"
formatBsDate(date: BSDate, options?: { nepali?: boolean }): string
parseBsDate(value: string): BSDate

getBsMonthName(month: number): string
getBsMonthNameNepali(month: number): string
getBsWeekdayName(weekday: number): string // 0 = "Sunday"
getBsWeekdayNameNepali(weekday: number): string // 0 = "आइतवार"
toNepaliDigits(value: string | number): string
fromNepaliDigits(value: string): string

class InvalidBSDateError extends RangeError { field: "year" | "month" | "day" }
class DateOutOfRangeError extends RangeError {}
class BSDateFormatError extends SyntaxError { input: string }
class InvalidDateOrderError extends RangeError {}
```

Every function returns a new object and never modifies its arguments.

### Errors

| Error                   | Thrown when                                                                                   | go-bs equivalent                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `InvalidBSDateError`    | A BS year, month or day is out of range or not an integer. `field` says which one.            | `ErrInvalidYear` / `ErrInvalidMonth` / `ErrInvalidDay` |
| `DateOutOfRangeError`   | An AD date, or the result of `addBsDays`/`subtractBsDays`, falls outside the supported range  | `ErrOutOfRange`                                        |
| `BSDateFormatError`     | `parseBsDate` gets a string not shaped like `YYYY-MM-DD`                                      | `ErrInvalidFormat`                                     |
| `TypeError`             | The argument has the wrong type: not a `Date`, an `Invalid Date`, not an object, not a string | —                                                      |
| `InvalidDateOrderError` | `getBsAge` gets a birth date after the reference date                                         | `ErrInvalidDateOrder`                                  |
| `RangeError`            | `addBsDays`/`subtractBsDays` gets a day count that isn't a safe integer                       | —                                                      |

```ts
import { InvalidBSDateError, bsToAd } from "bikram-sambat-ts";

try {
  bsToAd({ year: 2083, month: 13, day: 1 });
} catch (error) {
  if (error instanceof InvalidBSDateError) {
    error.field; // "month"
    error.message; // "bs: invalid month: 13"
  }
}
```

## Supported range

- Bikram Sambat: **1979-01-01 to 2100-12-31** (`MIN_BS_YEAR`–`MAX_BS_YEAR`)
- Gregorian: **1922-04-13 to 2044-04-13**

These are the same bounds as go-bs, worked out from the calendar data rather
than assumed. `MAX_BS_YEAR` will move out further when go-bs extends its data.

## Timezone behavior

This package converts **calendar dates**, not instants. A JavaScript `Date` is
an instant, so the package has to pick which calendar day that instant belongs
to. It uses the **local** calendar, consistently in both directions:

- `adToBs(date)` looks only at `date.getFullYear()`, `getMonth()` and
  `getDate()`. The time of day is ignored.
- `bsToAd(bs)` returns local midnight, so its `getFullYear()`, `getMonth()`
  and `getDate()` are the AD date.

So `adToBs(new Date(2026, 8, 22))` and `adToBs(new Date(2026, 8, 22, 23, 59))`
both return BS 2083-06-06, whatever the timezone, and `adToBs(bsToAd(x))` is
always `x`. This mirrors go-bs, where `ADToBS` reads the Year/Month/Day of the
`time.Time` as it's expressed. Internally, all day arithmetic uses UTC day
numbers, so daylight saving time never shifts a result.

Things to watch for:

- **`new Date("2026-09-22")` is UTC midnight**, not local midnight. That's how
  JavaScript parses a date-only ISO string. West of UTC (the Americas), its
  local date is 21 September. Use `new Date(2026, 8, 22)` or
  `new Date("2026-09-22T00:00")`, which are local, when you mean a calendar
  date.
- **`adToBs(new Date())` gives today in the device's timezone.** On a server
  running in UTC, that isn't today in Nepal for the 5 h 45 min after midnight
  Nepal time. Use `todayBs()` instead: like go-bs's `TodayBS`, it always uses
  Nepal Standard Time (a fixed UTC+05:45, so it doesn't depend on the
  runtime's timezone data).
- A handful of timezones skipped a whole calendar day when they moved across
  the International Date Line. In this range those are 1994-12-31 in
  `Pacific/Kiritimati` and 2011-12-30 in `Pacific/Apia`. No `Date` has that
  day as its local date, so in those zones `bsToAd` for the matching BS day
  returns the following day.

The test suite runs in UTC, Asia/Kathmandu, America/Los_Angeles,
America/Sao_Paulo, Asia/Tehran, Pacific/Kiritimati, Pacific/Apia,
Pacific/Pago_Pago and Australia/Lord_Howe.

## Calendar data and accuracy

BS month lengths don't follow a formula. They come from Nepal's published
calendar, stored as a static table in the package. There's no API call, no
scraping and no network access at runtime; the package works fully offline.

The table is exported directly from go-bs (currently **v0.7.0**) by a
maintainer tool, and it's committed as `data/calendar.json` and the generated
`src/data.ts`. go-bs got its data from Hamro Patro's calendar data for BS
2000–2100, and from the amitgaru/nepali-datetime table for BS 1979–1999. It's
checked against known dates and the boundaries where BS years meet. Hamro
Patro and the other sources are cited as the provenance of the calendar
_facts_; they don't license or endorse this package.

See [docs/calendar-data.md](docs/calendar-data.md) for the full provenance,
how the data is verified, and **known issues**: the data for BS 1979–1999 and
for the far-future years around BS 2085–2100 is less certain, and BS 2087
(367 days) and BS 2096 (364 days) look wrong.

## Compatibility with go-bs

Correctness rests on three separate checks:

1. **Verified static dataset**, identical to go-bs's (the test suite checks
   this month by month).
2. **Independently known AD/BS pairs**, ported from go-bs's `knownPairs`.
3. **Go comparison fixtures**: the published go-bs module was run once to
   record its output for every supported day (AD date, weekday, day of year)
   and every supported month (calendar grid, start/end, next/previous month),
   plus about 1,450 edge cases (validation, parsing, formatting, arithmetic,
   age, out-of-range). The tests compare against these recordings and never
   run Go.

Deliberate differences from go-bs:

- `compareBsDates`, `isBeforeBs`, `isAfterBs` and `isEqualBs` validate their
  arguments. go-bs's `Compare` doesn't, but in JavaScript a `NaN` field would
  quietly compare as "equal".
- `formatBsDate` with no layout validates, like go-bs's `Format`, unlike its
  `String`.
- `startOfBsMonth`, `endOfBsMonth`, `startOfBsYear` and `endOfBsYear` validate
  the whole date. go-bs's versions only check the year and month, so they
  accept an invalid day.
- `nextBsMonth`/`previousBsMonth` past either end of the range throw
  `InvalidBSDateError` with `field: "year"`, matching go-bs's `ErrInvalidYear`
  (whereas `addBsDays` throws `DateOutOfRangeError`, like go-bs's `AddDays`).
- Not included: go-bs's JSON/SQL encoders, which are Go-specific. A
  `BSDate` is a plain object, so it already serializes as
  `{"year":2083,"month":6,"day":6}`; use `formatBsDate`/`parseBsDate` for the
  `"2083-06-06"` form.

## Testing

```sh
bun install
bun test                 # full suite (runs in UTC)
bun run test:timezones   # full suite in 9 timezones
bun run build && bun run test:smoke  # built ESM/CJS in plain Node
```

The suite includes exhaustive BS → AD → BS and AD → BS → AD round trips over
every supported day. It also checks every day against go-bs. Round trips on
their own could pass even if the data were wrong in a consistent way, which is
why the go-bs comparison and the known pairs matter.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

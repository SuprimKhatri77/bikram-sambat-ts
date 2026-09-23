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
✓ ESM + CommonJS + type declarations, tree-shakable (~2.5 KB gzipped in total)
```

## Features

- `adToBs` / `bsToAd` conversion
- Strict validation against real BS month lengths (not just a 1–32 check),
  including `NaN`, `Infinity`, fractional values and `Invalid Date`
- Day arithmetic and comparison
- Formatting and parsing, English and Nepali month names, Nepali digits
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

### Formatting and parsing

```ts
import { formatBsDate, parseBsDate } from "bikram-sambat-ts";

formatBsDate({ year: 2083, month: 6, day: 6 }); // "2083-06-06"
formatBsDate({ year: 2083, month: 6, day: 6 }, "dddd, MMMM D, YYYY"); // "Tuesday, Ashwin 6, 2083"
parseBsDate("2083-06-15"); // { year: 2083, month: 6, day: 15 }
```

The layout tokens are the same as go-bs's `Date.Format`:

| Token  | Output               | Example   |
| ------ | -------------------- | --------- |
| `YYYY` | 4-digit year         | `2083`    |
| `YY`   | 2-digit year         | `83`      |
| `MMMM` | English month name   | `Ashwin`  |
| `MM`   | month, zero-padded   | `06`      |
| `M`    | month                | `6`       |
| `DD`   | day, zero-padded     | `06`      |
| `D`    | day                  | `6`       |
| `dddd` | English weekday name | `Tuesday` |
| `ddd`  | 3-letter weekday     | `Tue`     |

Any other character is copied as-is. There's no escaping, so a literal `D` or
`M` in the layout is always treated as a token. `parseBsDate` accepts only
`YYYY-MM-DD` (zero-padded, ASCII digits).

### Month names and Nepali digits

```ts
import {
  fromNepaliDigits,
  getBsMonthName,
  getBsMonthNameNepali,
  toNepaliDigits,
} from "bikram-sambat-ts";

getBsMonthName(6); // "Ashwin"
getBsMonthNameNepali(6); // "असोज"
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

isValidBsDate(date: BSDate): boolean
isSupportedBsYear(year: number): boolean
daysInBsMonth(year: number, month: number): number
daysInBsYear(year: number): number

addBsDays(date: BSDate, days: number): BSDate
subtractBsDays(date: BSDate, days: number): BSDate
daysBetweenBs(from: BSDate, to: BSDate): number // to − from
getBsDayOfWeek(date: BSDate): Weekday

compareBsDates(a: BSDate, b: BSDate): -1 | 0 | 1
isBeforeBs(a: BSDate, b: BSDate): boolean
isAfterBs(a: BSDate, b: BSDate): boolean
isEqualBs(a: BSDate, b: BSDate): boolean

formatBsDate(date: BSDate, layout?: string): string // default "YYYY-MM-DD"
parseBsDate(value: string): BSDate

getBsMonthName(month: number): string
getBsMonthNameNepali(month: number): string
toNepaliDigits(value: string | number): string
fromNepaliDigits(value: string): string

class InvalidBSDateError extends RangeError { field: "year" | "month" | "day" }
class DateOutOfRangeError extends RangeError {}
class BSDateFormatError extends SyntaxError { input: string }
```

Every function returns a new object and never modifies its arguments.

### Errors

| Error                 | Thrown when                                                                                   | go-bs equivalent                                       |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `InvalidBSDateError`  | A BS year, month or day is out of range or not an integer. `field` says which one.            | `ErrInvalidYear` / `ErrInvalidMonth` / `ErrInvalidDay` |
| `DateOutOfRangeError` | An AD date, or the result of `addBsDays`/`subtractBsDays`, falls outside the supported range  | `ErrOutOfRange`                                        |
| `BSDateFormatError`   | `parseBsDate` gets a string not shaped like `YYYY-MM-DD`                                      | `ErrInvalidFormat`                                     |
| `TypeError`           | The argument has the wrong type: not a `Date`, an `Invalid Date`, not an object, not a string | —                                                      |
| `RangeError`          | `addBsDays`/`subtractBsDays` gets a day count that isn't a safe integer                       | —                                                      |

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
  Nepal time. go-bs has a `TodayBS` helper that always uses Nepal time. This
  package doesn't have one yet (see the changelog).
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

The table is exported directly from go-bs (currently **v0.6.1**) by a
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
   record its output for every supported day (AD date, weekday, day of year),
   plus about 1,150 edge cases (validation, parsing, formatting, arithmetic,
   out-of-range). The tests compare against these recordings and never run Go.

Deliberate differences from go-bs:

- `compareBsDates`, `isBeforeBs`, `isAfterBs` and `isEqualBs` validate their
  arguments. go-bs's `Compare` doesn't, but in JavaScript a `NaN` field would
  quietly compare as "equal".
- `formatBsDate` with no layout validates, like go-bs's `Format`, unlike its
  `String`.
- Not included yet: go-bs's `NextMonth`/`PreviousMonth`, start/end-of-month and
  -year helpers, `DayOfYear`, `Age`, `TodayBS`, `MonthCalendar` and the
  JSON/SQL encoders.

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

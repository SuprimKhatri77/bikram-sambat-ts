# Calendar data: sources and verification

This package supports Bikram Sambat (BS) years `1979` through `2100`
inclusive (`MIN_BS_YEAR`/`MAX_BS_YEAR` in `src/constants.ts`). BS month lengths
don't follow a formula. They come from Nepal's published calendar and are
stored as a static table in `src/data.ts`.

**No calendar service is contacted at runtime.** The package makes no network
requests, scrapes nothing, and works fully offline. The data was collected and
checked once, ahead of time, and ships as a plain array in the package.

## Where the data comes from

This package doesn't collect calendar data itself. Its dataset is taken from
its Go sibling, [go-bs](https://github.com/suprimkhatri77/go-bs), and go-bs is
treated as the reference specification. The pipeline is:

```text
go-bs (published module, pinned version)
   │  tools/go-reference  (maintainer tool, run by hand)
   ▼
data/calendar.json                  canonical month-length table
tests/fixtures/go-conversions.json  go-bs's output for all 44,562 supported days
tests/fixtures/go-cases.json        go-bs's output for about 1,150 edge cases
   │  scripts/generate-data.ts  (bun run generate)
   ▼
src/data.ts                         generated, committed, DO NOT EDIT
```

`tools/go-reference` depends on the **published** go-bs module (currently
`github.com/suprimkhatri77/go-bs@v0.7.0`, pinned in its `go.mod` and checked
against `go.sum`), not a local checkout. It reads the table through go-bs's
public API (`DaysInMonth`), not by parsing go-bs's source. Every output file
records the go-bs version it came from, and the test suite checks that version.

Package users never need Go, the generator, or the JSON files. The published
npm package contains only `dist/`.

## How go-bs sourced the data

This section summarizes go-bs's
[`docs/calendar-data.md`](https://github.com/suprimkhatri77/go-bs/blob/main/docs/calendar-data.md);
that document has the full details.

- **BS 2000–2100** were read from [Hamro Patro](https://www.hamropatro.com/calendar)'s
  structured calendar data. That data records each day's AD and BS date side
  by side, and each month's length was taken only from complete, gap-free
  runs of days. Hamro Patro is closed source. It was used as a reference for
  calendar _facts_, and no code was copied from it.
- **BS 1979–1999** come from the
  [amitgaru/nepali-datetime](https://github.com/amitgaru/nepali-datetime)
  table (Apache-2.0), which agrees with
  [askbuddie/bikram-sambat](https://github.com/askbuddie/bikram-sambat) (MIT)
  for all of those years. Hamro Patro has no data before BS 2000. As a check,
  the total length of BS 1979–1999 was added to the reference date and lands
  exactly on Hamro Patro's own BS 2000-01-01 (AD 1943-04-14).
- go-bs found that all three open-source libraries it compared contain real
  errors in some years, and that two libraries agreeing with each other did
  not reliably mean they were right. That's why it relied on a live source
  wherever one existed.

None of these sources license, endorse or maintain this package. They're
cited here only as the origin of the calendar facts.

## Reference date

```text
BS 1979-01-01 = AD 1922-04-13
```

This is the same anchor go-bs uses (see its docs for how it was verified).
The last supported date, BS 2100-12-31, is AD 2044-04-13. Both ends are in
this package's known-pair tests, along with the rest of go-bs's `knownPairs`.

## How this package verifies the data

1. **Shape**: 122 years × 12 months = 1,464 months, each 29–32 days, and
   44,562 days in total (`tests/data.test.ts`).
2. **Same as go-bs**: `src/data.ts` must match `data/calendar.json` month by
   month, and a fixed checksum of the whole table is pinned so that any change
   to the data is visible.
3. **Known pairs**: go-bs's independently verified AD/BS pairs
   (`tests/convert.test.ts`).
4. **Same behavior as go-bs**: for every supported day, `bsToAd`, `adToBs`,
   the weekday and the day of the year must match go-bs's recorded output,
   along with go-bs's edge-case results (`tests/compatibility.test.ts`).
5. **Round trips**: BS → AD → BS and AD → BS → AD for every supported day.
   These catch internal inconsistencies, but not data that is wrong in a
   consistent way. That's what checks 2–4 are for.

## Known issues

These are inherited from go-bs. This package reproduces them on purpose, so
that the two packages never disagree. Fixes belong in go-bs first, with a
cited source (see "Changing the data" below), and then come here through a
regenerated table.

- **BS 1979–1999 isn't checked day by day against a live source.** Only the
  year boundaries are corroborated (see above).
- **BS 2087 has 367 days and BS 2096 has 364.** Every other year has 365 or
  366, and a solar BS year can't really be 364 or 367 days long.
  - BS 2087: Mangsir (month 8) has 30 days in go-bs but 29 in both amitgaru
    and askbuddie.
  - BS 2096: 364 days in go-bs, amitgaru and askbuddie alike.
  - The effect: go-bs's BS 2088–2096 new years fall on AD 15–16 April. The
    years just before start on 13–14 April, and BS 2097 starts on 14 April
    again.
  - This most likely comes from projected, not officially published,
    far-future data. The open-source tables disagree with each other a lot in
    this period too. For example, bikram-sambat-js puts BS 2088-01-01 on AD
    2031-04-17 and BS 2089-01-01 on AD 2032-04-14.
  - Treat conversions for roughly BS 2085–2100 as provisional.
  - `tests/data.test.ts` pins these two years as known exceptions, so any
    new anomaly fails the tests.

## Changing the data

Don't edit `src/data.ts` or `data/calendar.json` by hand. The data changes
only when go-bs does:

1. Fix the data in go-bs, with a cited, independently checkable source (a
   live calendar or an official publication, not another library's table),
   and release a new go-bs version.
2. Here, bump the go-bs version in `tools/go-reference/go.mod` and
   `goBSVersion` in `tools/go-reference/main.go`, then run:

   ```sh
   cd tools/go-reference && go get github.com/suprimkhatri77/go-bs@vX.Y.Z && go run . -root ../..
   cd ../.. && bun run generate
   ```

3. Update the go-bs version and the checksum in the tests. Update
   `KNOWN_ANOMALOUS_YEARS` too if the fix resolves one. Then run the full
   suite (`bun test`, `bun run test:timezones`).

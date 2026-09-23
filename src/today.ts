import { MS_PER_DAY, assertDate, gregorianDayToBs } from "./convert";
import type { BSDate } from "./types";

/**
 * Nepal Standard Time's offset from UTC, +05:45, in effect since 1986 with no
 * daylight saving time. A fixed offset (the same one go-bs uses) avoids
 * depending on the runtime's timezone database.
 */
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60_000;

/**
 * Returns today's date in Nepal (Nepal Standard Time, UTC+05:45) as a BS
 * date, whatever timezone the code runs in.
 *
 * This is not the same as `adToBs(new Date())`, which gives today in the
 * *runtime's* timezone. On a server set to UTC (the usual default for cloud
 * machines and containers), that's yesterday's date for the 5 h 45 min after
 * midnight in Nepal. Use `todayBs()` whenever "today" should mean today in
 * Nepal, e.g. on a server. Use `adToBs(new Date())` for the user's own
 * calendar day in a browser.
 *
 * Pass `now` to ask about a different instant (useful in tests). It's always
 * read as UTC+05:45, even for instants before 1986, when Nepal was on
 * UTC+05:30. That matches go-bs's `TodayBS`.
 *
 * @example
 * todayBs(); // e.g. { year: 2083, month: 6, day: 7 }
 * // 20:00 UTC on 22 September 2026 is 01:45 on 23 September in Nepal.
 * todayBs(new Date("2026-09-22T20:00:00Z")); // { year: 2083, month: 6, day: 7 }
 *
 * @throws {TypeError} If `now` is not a `Date`, or is an Invalid Date.
 * @throws {DateOutOfRangeError} If the date in Nepal is outside BS 1979–2100.
 */
export function todayBs(now: Date = new Date()): BSDate {
  assertDate(now, "todayBs");
  return gregorianDayToBs(Math.floor((now.getTime() + NEPAL_OFFSET_MS) / MS_PER_DAY));
}

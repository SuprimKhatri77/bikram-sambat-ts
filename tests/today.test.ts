import { describe, expect, test } from "bun:test";
import { DateOutOfRangeError, adToBs, todayBs } from "../src";
import { bs } from "./helpers";

describe("todayBs", () => {
  test("uses Nepal time, not UTC or the process timezone", () => {
    // The same instant go-bs's TestTodayBSIgnoresLocalTimezone locks in:
    // 20:00 UTC on 22 September 2026 is already 01:45 on the 23rd in Nepal.
    expect(todayBs(new Date("2026-09-22T20:00:00Z"))).toEqual(bs("2083-06-07"));
    expect(todayBs(new Date("2026-09-22T12:00:00Z"))).toEqual(bs("2083-06-06"));
  });

  test("the day changes at midnight in Nepal (18:15 UTC)", () => {
    expect(todayBs(new Date("2026-09-22T18:14:59.999Z"))).toEqual(bs("2083-06-06"));
    expect(todayBs(new Date("2026-09-22T18:15:00.000Z"))).toEqual(bs("2083-06-07"));
    expect(todayBs(new Date("2026-09-23T00:00:00+05:45"))).toEqual(bs("2083-06-07"));
    expect(todayBs(new Date("2026-09-23T23:59:59+05:45"))).toEqual(bs("2083-06-07"));
  });

  test("crosses BS new year at midnight in Nepal", () => {
    // BS 2083-01-01 is AD 2026-04-14.
    expect(todayBs(new Date("2026-04-13T23:59:59+05:45"))).toEqual(bs("2082-12-30"));
    expect(todayBs(new Date("2026-04-14T00:00:00+05:45"))).toEqual(bs("2083-01-01"));
  });

  test("defaults to the current instant", () => {
    const before = todayBs(new Date());
    const today = todayBs();
    const after = todayBs(new Date());
    expect([before, after]).toContainEqual(today);
  });

  test("matches adToBs when the process itself runs in Nepal time", () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz !== "Asia/Kathmandu" && tz !== "Asia/Katmandu") {
      return; // covered when `bun run test:timezones` runs this in Asia/Kathmandu
    }
    for (const iso of ["2026-09-22T18:14:59Z", "2026-09-22T18:15:00Z", "2000-01-01T00:00:00Z"]) {
      expect(todayBs(new Date(iso))).toEqual(adToBs(new Date(iso)));
    }
  });

  test("rejects non-Dates, Invalid Date and out-of-range instants", () => {
    expect(() => todayBs(new Date(Number.NaN))).toThrow(TypeError);
    expect(() => todayBs("2026-09-22" as unknown as Date)).toThrow(TypeError);
    expect(() => todayBs(new Date("2044-04-13T18:15:00Z"))).toThrow(DateOutOfRangeError);
    expect(todayBs(new Date("2044-04-13T18:14:59Z"))).toEqual(bs("2100-12-31"));
    expect(() => todayBs(new Date("1922-04-12T18:14:59Z"))).toThrow(DateOutOfRangeError);
    expect(todayBs(new Date("1922-04-12T18:15:00Z"))).toEqual(bs("1979-01-01"));
  });
});

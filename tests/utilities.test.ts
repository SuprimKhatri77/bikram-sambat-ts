import { describe, expect, test } from "bun:test";
import {
  BSDateFormatError,
  DateOutOfRangeError,
  InvalidBSDateError,
  addBsDays,
  compareBsDates,
  daysBetweenBs,
  formatBsDate,
  fromNepaliDigits,
  getBsDayOfWeek,
  getBsMonthName,
  getBsMonthNameNepali,
  isAfterBs,
  isBeforeBs,
  isEqualBs,
  parseBsDate,
  subtractBsDays,
  toNepaliDigits,
  type BSDate,
} from "../src";
import { bs, forEachBsDate } from "./helpers";

describe("addBsDays / subtractBsDays", () => {
  const d = bs("2083-06-06");

  test("move by days, across month and year boundaries", () => {
    expect(addBsDays(d, 1)).toEqual(bs("2083-06-07"));
    expect(addBsDays(d, -1)).toEqual(bs("2083-06-05"));
    expect(addBsDays(d, 0)).toEqual(d);
    expect(addBsDays(bs("2083-06-31"), 1)).toEqual(bs("2083-07-01"));
    expect(subtractBsDays(bs("2083-07-01"), 1)).toEqual(bs("2083-06-31"));
    expect(addBsDays(bs("2082-12-30"), 1)).toEqual(bs("2083-01-01"));
    expect(subtractBsDays(bs("2083-01-01"), 1)).toEqual(bs("2082-12-30"));
    expect(addBsDays(bs("2083-01-01"), 365)).toEqual(bs("2084-01-01"));
    expect(subtractBsDays(d, 1)).toEqual(addBsDays(d, -1));
  });

  test("return a new object and leave the argument untouched", () => {
    const original = bs("2083-06-06");
    const result = addBsDays(original, 0);
    expect(result).not.toBe(original);
    expect(original).toEqual(bs("2083-06-06"));
  });

  test("throw DateOutOfRangeError past either end of the range", () => {
    expect(() => addBsDays(bs("2100-12-31"), 1)).toThrow(DateOutOfRangeError);
    expect(() => subtractBsDays(bs("1979-01-01"), 1)).toThrow(DateOutOfRangeError);
    expect(() => addBsDays(bs("2083-06-06"), Number.MAX_SAFE_INTEGER)).toThrow(DateOutOfRangeError);
  });

  test("reject invalid dates and non-integer day counts", () => {
    expect(() => addBsDays(bs("2083-13-01"), 1)).toThrow(InvalidBSDateError);
    for (const n of [Number.NaN, Infinity, 1.5, 2 ** 60]) {
      expect(() => addBsDays(d, n)).toThrow(RangeError);
    }
  });

  test("stepping one day at a time visits every supported date in order", () => {
    let expected: BSDate | undefined;
    forEachBsDate((date) => {
      if (expected !== undefined) {
        expect(date).toEqual(expected);
      }
      expected =
        date.year === 2100 && date.month === 12 && date.day === 31 ? undefined : addBsDays(date, 1);
    });
  });
});

describe("daysBetweenBs", () => {
  test("is to - from", () => {
    expect(daysBetweenBs(bs("2083-06-06"), bs("2083-06-16"))).toBe(10);
    expect(daysBetweenBs(bs("2083-06-16"), bs("2083-06-06"))).toBe(-10);
    expect(daysBetweenBs(bs("2083-06-06"), bs("2083-06-06"))).toBe(0);
    expect(daysBetweenBs(bs("1979-01-01"), bs("2100-12-31"))).toBe(44561);
  });

  test("rejects invalid dates", () => {
    expect(() => daysBetweenBs(bs("2083-06-32"), bs("2083-06-06"))).toThrow(InvalidBSDateError);
  });
});

describe("comparison", () => {
  const a = bs("2083-06-06");
  const b = bs("2083-06-07");

  test("orders by year, then month, then day", () => {
    expect(compareBsDates(a, b)).toBe(-1);
    expect(compareBsDates(b, a)).toBe(1);
    expect(compareBsDates(a, { ...a })).toBe(0);
    expect(compareBsDates(bs("2082-12-30"), bs("2083-01-01"))).toBe(-1);
    expect(compareBsDates(bs("2083-05-31"), bs("2083-06-01"))).toBe(-1);
    expect(isBeforeBs(a, b)).toBe(true);
    expect(isBeforeBs(b, a)).toBe(false);
    expect(isAfterBs(b, a)).toBe(true);
    expect(isAfterBs(a, a)).toBe(false);
    expect(isEqualBs(a, { ...a })).toBe(true);
    expect(isEqualBs(a, b)).toBe(false);
  });

  test("works as a sort comparator", () => {
    const dates = [bs("2083-06-07"), bs("1979-01-01"), bs("2100-12-31"), bs("2083-06-06")];
    expect(dates.sort(compareBsDates).map((d) => formatBsDate(d))).toEqual([
      "1979-01-01",
      "2083-06-06",
      "2083-06-07",
      "2100-12-31",
    ]);
  });

  test("rejects invalid dates instead of guessing", () => {
    expect(() => compareBsDates(a, { year: 2083, month: 6, day: Number.NaN })).toThrow(
      InvalidBSDateError,
    );
    expect(() => isEqualBs(bs("2083-13-01"), bs("2083-13-01"))).toThrow(InvalidBSDateError);
  });
});

describe("getBsDayOfWeek", () => {
  test("uses Date#getDay numbering", () => {
    expect(getBsDayOfWeek(bs("2083-06-06"))).toBe(2); // Tuesday, AD 2026-09-22
    expect(getBsDayOfWeek(bs("1979-01-01"))).toBe(4); // Thursday, AD 1922-04-13
  });

  test("rejects invalid dates", () => {
    expect(() => getBsDayOfWeek(bs("2083-13-01"))).toThrow(InvalidBSDateError);
  });
});

describe("formatBsDate", () => {
  const d = bs("2083-06-06");

  test("defaults to YYYY-MM-DD", () => {
    expect(formatBsDate(d)).toBe("2083-06-06");
    expect(formatBsDate(bs("2083-01-01"))).toBe("2083-01-01");
  });

  test("supports go-bs's layout tokens", () => {
    expect(formatBsDate(d, "YY-M-D")).toBe("83-6-6");
    expect(formatBsDate(d, "MMMM D, YYYY")).toBe("Ashwin 6, 2083");
    expect(formatBsDate(d, "dddd, MMMM D, YYYY")).toBe("Tuesday, Ashwin 6, 2083");
    expect(formatBsDate(d, "ddd")).toBe("Tue");
    expect(formatBsDate(bs("2083-01-01"), "D-M-YYYY")).toBe("1-1-2083");
    expect(formatBsDate(bs("2083-01-01"), "DD-MM-YYYY")).toBe("01-01-2083");
    expect(formatBsDate(d, "")).toBe("");
    expect(formatBsDate(d, "मिति: YYYY")).toBe("मिति: 2083");
  });

  test("round-trips with parseBsDate for every supported date", () => {
    forEachBsDate((date) => {
      const back = parseBsDate(formatBsDate(date));
      if (back.year !== date.year || back.month !== date.month || back.day !== date.day) {
        throw new Error(`format/parse mismatch for ${JSON.stringify(date)}`);
      }
    });
  });

  test("rejects invalid dates", () => {
    expect(() => formatBsDate(bs("2083-13-01"))).toThrow(InvalidBSDateError);
    expect(() => formatBsDate(bs("1978-01-01"), "YYYY")).toThrow(InvalidBSDateError);
  });
});

describe("parseBsDate", () => {
  test("parses YYYY-MM-DD", () => {
    expect(parseBsDate("2083-06-06")).toEqual(bs("2083-06-06"));
  });

  test("distinguishes bad shape from bad date", () => {
    for (const s of ["", "2083/06/06", "2083-6-6", "2083-06-06x", " 2083-06-06", "२०८३-०६-०६"]) {
      expect(() => parseBsDate(s)).toThrow(BSDateFormatError);
    }
    expect(() => parseBsDate("2083-13-01")).toThrow(InvalidBSDateError);
    expect(() => parseBsDate("1978-01-01")).toThrow(InvalidBSDateError);
    expect(() => parseBsDate("2083-06-32")).toThrow(InvalidBSDateError);
  });

  test("exposes the rejected input", () => {
    try {
      parseBsDate("2083/06/06");
      throw new Error("expected parseBsDate to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BSDateFormatError);
      expect(error).toBeInstanceOf(SyntaxError);
      expect((error as BSDateFormatError).input).toBe("2083/06/06");
    }
  });

  test("rejects non-strings", () => {
    expect(() => parseBsDate(20830606 as unknown as string)).toThrow(TypeError);
  });

  test("works with Devanagari digits via fromNepaliDigits", () => {
    expect(parseBsDate(fromNepaliDigits("२०८३-०६-०६"))).toEqual(bs("2083-06-06"));
  });
});

describe("month names", () => {
  test("English and Nepali", () => {
    expect(getBsMonthName(1)).toBe("Baisakh");
    expect(getBsMonthName(6)).toBe("Ashwin");
    expect(getBsMonthName(12)).toBe("Chaitra");
    expect(getBsMonthNameNepali(1)).toBe("वैशाख");
    expect(getBsMonthNameNepali(6)).toBe("असोज");
    expect(getBsMonthNameNepali(12)).toBe("चैत");
  });

  test("reject invalid months", () => {
    for (const month of [0, 13, -1, 1.5, Number.NaN]) {
      expect(() => getBsMonthName(month)).toThrow(InvalidBSDateError);
      expect(() => getBsMonthNameNepali(month)).toThrow(InvalidBSDateError);
    }
  });
});

describe("Nepali digits", () => {
  test("convert both ways", () => {
    expect(toNepaliDigits("2083-06-06")).toBe("२०८३-०६-०६");
    expect(toNepaliDigits(2083)).toBe("२०८३");
    expect(toNepaliDigits("no digits here")).toBe("no digits here");
    expect(fromNepaliDigits("२०८३-०६-०६")).toBe("2083-06-06");
    expect(fromNepaliDigits("०१२३४५६७८९")).toBe("0123456789");
    const original = "2083-06-06 has 10 digits: 0123456789";
    expect(fromNepaliDigits(toNepaliDigits(original))).toBe(original);
  });
});

describe("errors", () => {
  test("have useful names and are RangeError/SyntaxError subclasses", () => {
    const invalid = new InvalidBSDateError("day", "x");
    expect(invalid.name).toBe("InvalidBSDateError");
    expect(invalid).toBeInstanceOf(RangeError);
    const outOfRange = new DateOutOfRangeError("x");
    expect(outOfRange.name).toBe("DateOutOfRangeError");
    expect(outOfRange).toBeInstanceOf(RangeError);
    expect(new BSDateFormatError("x", "y").name).toBe("BSDateFormatError");
  });
});

import { MONTHS_PER_YEAR } from "./constants";
import { InvalidBSDateError } from "./errors";

// prettier-ignore
const MONTH_NAMES = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const;

// Verified by go-bs against Hamro Patro's calendar page titles.
// prettier-ignore
const MONTH_NAMES_NEPALI = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत",
] as const;

/**
 * Returns the English name of a 1-based Bikram Sambat month
 * (1 is `"Baisakh"`, 12 is `"Chaitra"`).
 *
 * @throws {InvalidBSDateError} If `month` is not an integer from 1 to 12.
 */
export function getBsMonthName(month: number): string {
  return MONTH_NAMES[monthIndex(month)];
}

/**
 * Returns the Nepali (Devanagari) name of a 1-based Bikram Sambat month
 * (1 is `"वैशाख"`, 12 is `"चैत"`).
 *
 * @throws {InvalidBSDateError} If `month` is not an integer from 1 to 12.
 */
export function getBsMonthNameNepali(month: number): string {
  return MONTH_NAMES_NEPALI[monthIndex(month)];
}

function monthIndex(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > MONTHS_PER_YEAR) {
    throw new InvalidBSDateError("month", `bs: invalid month: ${String(month)}`);
  }
  return month - 1;
}

const NEPALI_DIGITS = "०१२३४५६७८९";

/**
 * Replaces every ASCII digit (0–9) with its Devanagari equivalent, e.g.
 * `"2083-06-06"` becomes `"२०८३-०६-०६"`. Everything else is copied through
 * unchanged. A number is converted with `String(value)` first.
 */
export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => NEPALI_DIGITS.charAt(d.charCodeAt(0) - 48));
}

/**
 * Replaces every Devanagari digit (०–९) with its ASCII equivalent, e.g.
 * `"२०८३"` becomes `"2083"`. Everything else is copied through unchanged.
 */
export function fromNepaliDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) => String(NEPALI_DIGITS.indexOf(d)));
}

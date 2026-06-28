/**
 * Formats a given SYP amount into a localized string representation.
 * @param amount - The amount in SYP (must be bigint to avoid precision loss).
 * @param locale - The locale to use for formatting (e.g., 'ar-SY' or 'en-US').
 * @returns The formatted string.
 */
export function formatSYP(amount: bigint | number, locale: "ar" | "en" = "ar"): string {
  const numAmount = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SY" : "en-US", {
    style: "currency",
    currency: "SYP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Converts SYP to USD based on the provided exchange rate.
 * @param amountSYP - The amount in SYP (bigint).
 * @param exchangeRate - The exchange rate (SYP to 1 USD).
 * @returns The converted amount in USD as a number.
 */
export function convertSYPtoUSD(amountSYP: bigint | number, exchangeRate: number): number {
  const numAmount = typeof amountSYP === "bigint" ? Number(amountSYP) : amountSYP;
  if (exchangeRate <= 0) {
    throw new Error("Exchange rate must be greater than zero.");
  }
  return Number((numAmount / exchangeRate).toFixed(2));
}

/**
 * Converts USD to SYP based on the provided exchange rate.
 * @param amountUSD - The amount in USD.
 * @param exchangeRate - The exchange rate (SYP to 1 USD).
 * @returns The converted amount in SYP as a bigint.
 */
export function convertUSDtoSYP(amountUSD: number, exchangeRate: number): bigint {
  if (exchangeRate <= 0) {
    throw new Error("Exchange rate must be greater than zero.");
  }
  // Math.round to ensure no decimals in SYP
  return BigInt(Math.round(amountUSD * exchangeRate));
}

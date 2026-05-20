/** Marketplace money display: 2–3 decimal places (up to thousandths). */
export const MONEY_MIN_FRACTION_DIGITS = 2;
export const MONEY_MAX_FRACTION_DIGITS = 3;

export function roundMoney(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}

export function moneyFormatOptions(): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: MONEY_MIN_FRACTION_DIGITS,
    maximumFractionDigits: MONEY_MAX_FRACTION_DIGITS,
  };
}

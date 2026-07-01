/** Marketplace money display: 2–3 decimal places (up to thousandths). */
export const MONEY_MIN_FRACTION_DIGITS = 2;
export const MONEY_MAX_FRACTION_DIGITS = 3;

/** Storefront prices (fair vitrine, product cards): supports centavos and unit pricing. */
export const STOREFRONT_MONEY_MIN_FRACTION_DIGITS = 2;
export const STOREFRONT_MONEY_MAX_FRACTION_DIGITS = 4;

export function localeForCurrency(currency: "USD" | "BRL"): string {
  return currency === "BRL" ? "pt-BR" : "en-US";
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}

export function roundStorefrontMoney(amount: number): number {
  return Math.round(amount * 10000) / 10000;
}

export function moneyFormatOptions(): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: MONEY_MIN_FRACTION_DIGITS,
    maximumFractionDigits: MONEY_MAX_FRACTION_DIGITS,
  };
}

export function storefrontMoneyFormatOptions(): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: STOREFRONT_MONEY_MIN_FRACTION_DIGITS,
    maximumFractionDigits: STOREFRONT_MONEY_MAX_FRACTION_DIGITS,
  };
}

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

/** Parses Prisma Decimal / string / number into a normalized storefront amount. */
export function parseStorefrontAmount(amount: unknown): number {
  if (amount == null || amount === "") return 0;
  const raw =
    typeof amount === "object" && amount !== null && "toString" in amount
      ? (amount as { toString(): string }).toString()
      : String(amount);
  const n = Number(raw);
  return Number.isFinite(n) ? roundStorefrontMoney(n) : 0;
}

/** Form field value: up to 4 decimal places without forcing cents-only rounding. */
export function amountToPriceInputString(amount: unknown): string {
  if (amount == null || amount === "") return "";
  const raw =
    typeof amount === "object" && amount !== null && "toString" in amount
      ? (amount as { toString(): string }).toString()
      : String(amount);
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const normalized = roundStorefrontMoney(n);
  return normalized
    .toFixed(STOREFRONT_MONEY_MAX_FRACTION_DIGITS)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

export function formatStorefrontMoney(amount: number, currency: "USD" | "BRL" = "BRL"): string {
  const rounded = roundStorefrontMoney(amount);
  return new Intl.NumberFormat(localeForCurrency(currency), {
    style: "currency",
    currency,
    ...storefrontMoneyFormatOptions(),
  }).format(rounded);
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

/** Paths under /account that SELLER without company may access (client-safe). */
export const SELLER_SETUP_ACCOUNT_PATHS = [
  "/account/company/setup",
  "/account/company",
  "/account/personal",
] as const;

export function isSellerSetupAccountPath(pathWithoutLocale: string): boolean {
  const normalized = pathWithoutLocale.replace(/\/$/, "") || "/";
  return SELLER_SETUP_ACCOUNT_PATHS.some(
    (p) => normalized === p || normalized.startsWith(`${p}/`),
  );
}

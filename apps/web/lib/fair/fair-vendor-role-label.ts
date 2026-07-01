import { getTranslations } from "next-intl/server";

const ROLE_KEYS: Record<string, "roleSeller" | "roleBuyer" | "roleAdmin"> = {
  SELLER: "roleSeller",
  BUYER: "roleBuyer",
  ADMIN: "roleAdmin",
};

export async function fairVendorRoleLabel(role: string) {
  const t = await getTranslations("fairVendor");
  const key = ROLE_KEYS[role];
  return key ? t(key) : role;
}

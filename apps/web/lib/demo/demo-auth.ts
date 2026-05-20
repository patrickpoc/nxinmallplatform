import { signIn } from "next-auth/react";

export const DEMO_BUYER_EMAIL = "demo-buyer@nxinmall.local";
export const DEMO_BUYER_PASSWORD = "demo";

/** Seeded seller with APPROVED company — see packages/database/prisma/seed.ts */
export const DEMO_SELLER_EMAIL = "demo-seller@nxinmall.local";
export const DEMO_SELLER_PASSWORD = "demo";

export async function signInDemoBuyer(callbackUrl?: string) {
  return signIn("credentials", {
    email: DEMO_BUYER_EMAIL,
    password: DEMO_BUYER_PASSWORD,
    redirect: false,
    callbackUrl,
  });
}

export async function signInDemoSeller(callbackUrl?: string) {
  return signIn("credentials", {
    email: DEMO_SELLER_EMAIL,
    password: DEMO_SELLER_PASSWORD,
    redirect: false,
    callbackUrl,
  });
}

export function isDemoSellerEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === DEMO_SELLER_EMAIL;
}

import { signIn } from "next-auth/react";

export const DEMO_BUYER_EMAIL = "demo-buyer@nxinmall.local";
export const DEMO_BUYER_PASSWORD = "demo";

export async function signInDemoBuyer(callbackUrl?: string) {
  return signIn("credentials", {
    email: DEMO_BUYER_EMAIL,
    password: DEMO_BUYER_PASSWORD,
    redirect: false,
    callbackUrl,
  });
}

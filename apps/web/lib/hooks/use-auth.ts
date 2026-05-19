"use client";

import { useSession } from "next-auth/react";

/** Client hook wrapping NextAuth session (role-aware UI in dashboards). */
export function useAuth() {
  return useSession();
}

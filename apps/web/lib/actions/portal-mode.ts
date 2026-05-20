"use server";

import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import type { PortalMode } from "@/lib/portal/portal-mode";

export type SetPortalModeResult =
  | { ok: true; mode: PortalMode }
  | { ok: false; error: "UNAUTHORIZED" | "NOT_SELLER" | "NO_COMPANY" };

export async function setPortalMode(mode: PortalMode): Promise<SetPortalModeResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  if (mode === "seller") {
    if (session.user.role !== "SELLER") {
      return { ok: false, error: "NOT_SELLER" };
    }
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!company) {
      return { ok: false, error: "NO_COMPANY" };
    }
  }

  return { ok: true, mode };
}

export async function getSellerCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return company?.id ?? null;
}

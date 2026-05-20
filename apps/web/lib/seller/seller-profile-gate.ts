import { prisma } from "@nxinmall/database";

export type SellerProfileState = {
  hasCompany: boolean;
  verificationStatus: string | null;
  isPlatformUnlocked: boolean;
};

export async function getSellerProfileState(userId: string): Promise<SellerProfileState> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true, verificationStatus: true },
  });

  const hasCompany = !!company;
  return {
    hasCompany,
    verificationStatus: company?.verificationStatus ?? null,
    isPlatformUnlocked: hasCompany,
  };
}

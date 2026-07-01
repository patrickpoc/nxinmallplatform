"use server";

import { prisma, Prisma } from "@nxinmall/database";
import { fairCheckoutSchema } from "@nxinmall/validators";
import { auth } from "@/auth";

export type CreateFairOrderResult = {
  orderId: string;
  pixKey: string;
  pixBeneficiaryName: string | null;
  totalBrl: number;
};

export async function createFairOrder(input: unknown): Promise<CreateFairOrderResult> {
  const parsed = fairCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  const booth = await prisma.fairBooth.findFirst({
    where: { slug: d.boothSlug, isActive: true },
    include: { user: true },
  });
  if (!booth) throw new Error("Booth not found or inactive");
  if (!booth.pixKey) throw new Error("Vendor has not configured Pix yet");

  const variantIds = d.items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      product: { sellerId: booth.userId, salesChannel: "FAIR", status: "ACTIVE" },
    },
    include: { product: true },
  });

  if (variants.length !== d.items.length) {
    throw new Error("Some products are no longer available");
  }

  const session = await auth();
  const buyerId = session?.user?.id ?? null;

  let totalBrl = 0;
  const lineData = d.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)!;
    const unitPrice = Number(variant.priceAmount);
    const lineTotal = unitPrice * item.quantity;
    totalBrl += lineTotal;
    return {
      variantId: variant.id,
      qty: new Prisma.Decimal(item.quantity),
      unitPriceUsd: new Prisma.Decimal(unitPrice),
      totalUsd: new Prisma.Decimal(lineTotal),
    };
  });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId,
        sellerId: booth.userId,
        status: "PENDING",
        salesChannel: "FAIR",
        fairBoothId: booth.id,
        guestName: d.guestName,
        guestEmail: d.guestEmail,
        guestPhone: d.guestPhone,
        guestCpf: d.guestCpf,
        incoterm: "seller",
        items: { create: lineData },
        payments: {
          create: {
            amount: new Prisma.Decimal(totalBrl),
            currency: "BRL",
            gateway: "PAGSEGURO",
            status: "PENDING",
            metadata: {
              method: "pix",
              pixKey: booth.pixKey,
              pixKeyType: booth.pixKeyType,
              guestDocumentType: d.guestDocumentType,
            },
          },
        },
        shipments: {
          create: {
            carrier: "Vendedor",
            status: "PENDING",
            incoterm: "seller",
          },
        },
      },
    });
    return created;
  });

  return {
    orderId: order.id,
    pixKey: booth.pixKey,
    pixBeneficiaryName: booth.pixBeneficiaryName,
    totalBrl: Math.round(totalBrl * 100) / 100,
  };
}

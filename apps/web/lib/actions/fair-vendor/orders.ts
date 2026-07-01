"use server";

import { prisma, Prisma } from "@nxinmall/database";
import { fairCheckoutSchema } from "@nxinmall/validators";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  buildFairOrderHandoffSummary,
  fairProductNameFromJson,
  type FairShippingAddress,
} from "@/lib/fair/fair-order-handoff-summary";
import { buildFairCartItemName, getFairVariantLabel } from "@/lib/fair/fair-variant-display";
import { parseStorefrontAmount, roundStorefrontMoney } from "@/lib/money-format";

export type CreateFairOrderResult = {
  orderId: string;
  pixKey: string;
  pixBeneficiaryName: string | null;
  totalBrl: number;
};

const fairOrderInclude = {
  items: {
    include: {
      variant: {
        select: { sku: true, priceAmount: true, attributes: true, product: { select: { name: true } } },
      },
    },
  },
  payments: { orderBy: { createdAt: "asc" as const }, take: 1 },
  fairBooth: { select: { companyName: true } },
} as const;

async function assertFairVendorOwnsOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "FAIR_VENDOR") throw new Error("Forbidden");

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerId: session.user.id,
      salesChannel: "FAIR",
    },
    include: fairOrderInclude,
  });
  if (!order) throw new Error("Order not found");
  return order;
}

function orderHandoffFromRecord(
  order: Awaited<ReturnType<typeof assertFairVendorOwnsOrder>>,
  locale?: string,
) {
  const items = order.items.map((item) => {
    const unitPriceBrl =
      parseStorefrontAmount(item.variant.priceAmount) || parseStorefrontAmount(item.unitPriceUsd);
    const quantity = Number(item.qty);
    return {
      productName: buildFairCartItemName(
        fairProductNameFromJson(item.variant.product.name),
        getFairVariantLabel({ sku: item.variant.sku, attributes: item.variant.attributes }),
      ),
      sku: item.variant.sku,
      quantity,
      unitPriceBrl,
      lineTotalBrl: roundStorefrontMoney(unitPriceBrl * quantity),
    };
  });
  const totalBrl = roundStorefrontMoney(items.reduce((s, i) => s + i.lineTotalBrl, 0));
  const paymentMeta = order.payments[0]?.metadata as { guestDocumentType?: string } | null;

  return buildFairOrderHandoffSummary({
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt,
    boothName: order.fairBooth?.companyName ?? "—",
    guestName: order.guestName,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    guestCpf: order.guestCpf,
    guestDocumentType: paymentMeta?.guestDocumentType ?? null,
    shippingAddress: order.shippingAddress as FairShippingAddress | null,
    items,
    totalBrl,
    locale,
  });
}

function revalidateFairVendor() {
  revalidatePath("/feira-vendor");
}

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
    const unitPrice = parseStorefrontAmount(variant.priceAmount);
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
        shippingAddress: {
          street: d.street,
          city: d.city,
          state: d.state ?? null,
          postalCode: d.postalCode,
          country: d.country,
        },
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
    totalBrl: roundStorefrontMoney(totalBrl),
  };
}

export async function confirmFairOrder(orderId: string): Promise<{ summary: string }> {
  const order = await assertFairVendorOwnsOrder(orderId);
  if (order.status !== "PENDING") {
    throw new Error("Only pending orders can be confirmed");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
    include: fairOrderInclude,
  });

  revalidateFairVendor();
  return { summary: orderHandoffFromRecord(updated) };
}

export async function cancelFairOrder(orderId: string): Promise<void> {
  const order = await assertFairVendorOwnsOrder(orderId);
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new Error("Only pending or confirmed orders can be cancelled");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  revalidateFairVendor();
}

export async function dismissFairOrder(orderId: string): Promise<void> {
  const order = await assertFairVendorOwnsOrder(orderId);
  if (order.status !== "CANCELLED") {
    throw new Error("Only cancelled orders can be removed from the listing");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { vendorDismissedAt: new Date() },
  });

  revalidateFairVendor();
}

export async function getFairOrderHandoffSummary(
  orderId: string,
  locale?: string,
): Promise<string> {
  const order = await assertFairVendorOwnsOrder(orderId);
  return orderHandoffFromRecord(order, locale);
}

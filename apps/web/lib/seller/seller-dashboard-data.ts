import { prisma } from "@nxinmall/database";

export type SellerProductRow = {
  id: string;
  nameEn: string;
  status: string;
  variantCount: number;
  minPriceUsd: string;
  stockUnits: number;
  updatedAt: Date;
};

export type SellerDashboardData = {
  companyName: string | null;
  verificationStatus: string | null;
  metrics: {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    totalVariants: number;
    unitsInStock: number;
    catalogValueUsd: number;
    ordersCount: number;
    pendingOrders: number;
    completedOrders: number;
    revenueUsd: number;
    unitsSold: number;
    avgOrderUsd: number;
  };
  recentOrders: {
    id: string;
    status: string;
    createdAt: Date;
    totalUsd: number;
    itemCount: number;
  }[];
  products: SellerProductRow[];
};

function labelEn(name: unknown): string {
  if (name && typeof name === "object" && "en" in (name as object)) {
    return String((name as { en?: string }).en ?? "—");
  }
  return "—";
}

export async function getSellerDashboardData(sellerId: string): Promise<SellerDashboardData> {
  const [company, products, orders] = await Promise.all([
    prisma.company.findUnique({ where: { userId: sellerId }, select: { name: true, verificationStatus: true } }),
    prisma.product.findMany({
      where: { sellerId },
      orderBy: { updatedAt: "desc" },
      include: { variants: true },
    }),
    prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  let totalVariants = 0;
  let unitsInStock = 0;
  let catalogValueUsd = 0;
  let activeProducts = 0;
  let draftProducts = 0;

  const productRows: SellerProductRow[] = products.map((p) => {
    if (p.status === "ACTIVE") activeProducts += 1;
    if (p.status === "DRAFT") draftProducts += 1;
    const variantCount = p.variants.length;
    totalVariants += variantCount;
    let stockUnits = 0;
    let minPrice = Number.POSITIVE_INFINITY;
    for (const v of p.variants) {
      stockUnits += v.stockQty;
      const price = Number(v.priceUsd);
      if (price < minPrice) minPrice = price;
      catalogValueUsd += price * v.stockQty;
    }
    unitsInStock += stockUnits;
    return {
      id: p.id,
      nameEn: labelEn(p.name),
      status: p.status,
      variantCount,
      minPriceUsd: Number.isFinite(minPrice) ? minPrice.toFixed(2) : "—",
      stockUnits,
      updatedAt: p.updatedAt,
    };
  });

  let revenueUsd = 0;
  let unitsSold = 0;
  let pendingOrders = 0;
  let completedOrders = 0;

  const recentOrders = orders.slice(0, 8).map((o) => {
    const totalUsd = o.items.reduce((sum, item) => sum + Number(item.totalUsd), 0);
    const itemCount = o.items.length;
    revenueUsd += totalUsd;
    for (const item of o.items) {
      unitsSold += Number(item.qty);
    }
    if (o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PROCESSING") {
      pendingOrders += 1;
    } else if (o.status !== "CANCELLED") {
      completedOrders += 1;
    }
    return {
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      totalUsd,
      itemCount,
    };
  });

  const ordersCount = orders.length;
  const avgOrderUsd = ordersCount > 0 ? revenueUsd / ordersCount : 0;

  return {
    companyName: company?.name ?? null,
    verificationStatus: company?.verificationStatus ?? null,
    metrics: {
      totalProducts: products.length,
      activeProducts,
      draftProducts,
      totalVariants,
      unitsInStock,
      catalogValueUsd: Math.round(catalogValueUsd * 100) / 100,
      ordersCount,
      pendingOrders,
      completedOrders,
      revenueUsd: Math.round(revenueUsd * 100) / 100,
      unitsSold: Math.round(unitsSold),
      avgOrderUsd: Math.round(avgOrderUsd * 100) / 100,
    },
    recentOrders,
    products: productRows,
  };
}

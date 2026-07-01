import { prisma } from "@nxinmall/database";

export type FairDashboardData = {
  boothName: string;
  slug: string;
  isActive: boolean;
  metrics: {
    activeProducts: number;
    totalProducts: number;
    ordersToday: number;
    pendingOrders: number;
    revenueBrl: number;
    ordersCount: number;
  };
  recentOrders: {
    id: string;
    status: string;
    createdAt: Date;
    totalBrl: number;
    guestName: string | null;
    itemCount: number;
  }[];
};

function labelPt(name: unknown): string {
  if (name && typeof name === "object") {
    const o = name as { pt?: string; en?: string };
    return o.pt ?? o.en ?? "—";
  }
  return "—";
}

export async function getFairDashboardData(vendorId: string): Promise<FairDashboardData | null> {
  const booth = await prisma.fairBooth.findUnique({ where: { userId: vendorId } });
  if (!booth) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: vendorId, salesChannel: "FAIR" },
      select: { id: true, status: true, name: true },
    }),
    prisma.order.findMany({
      where: { sellerId: vendorId, salesChannel: "FAIR", vendorDismissedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { variant: { select: { priceAmount: true, priceCurrency: true } } } },
      },
    }),
  ]);

  let revenueBrl = 0;
  let pendingOrders = 0;
  let ordersToday = 0;

  const recentOrders = orders.slice(0, 10).map((o) => {
    const totalBrl = o.items.reduce((sum, item) => {
      const amt = Number(item.variant.priceAmount) || Number(item.totalUsd);
      return sum + amt * Number(item.qty);
    }, 0);
    revenueBrl += totalBrl;
    if (o.createdAt >= startOfDay) ordersToday += 1;
    if (o.status === "PENDING" || o.status === "CONFIRMED") pendingOrders += 1;
    return {
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      totalBrl: Math.round(totalBrl * 100) / 100,
      guestName: o.guestName,
      itemCount: o.items.length,
    };
  });

  return {
    boothName: booth.companyName,
    slug: booth.slug,
    isActive: booth.isActive,
    metrics: {
      activeProducts: products.filter((p) => p.status === "ACTIVE").length,
      totalProducts: products.length,
      ordersToday,
      pendingOrders,
      revenueBrl: Math.round(revenueBrl * 100) / 100,
      ordersCount: orders.length,
    },
    recentOrders,
  };
}

export function fairProductLabel(name: unknown): string {
  return labelPt(name);
}

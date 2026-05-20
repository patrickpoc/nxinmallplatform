import type { SavedOrder } from "@/lib/account/orders-store";
import { roundMoney } from "@/lib/money-format";

export type BuyerPurchaseStats = {
  totalOrders: number;
  pendingCount: number;
  approvedCount: number;
  totalUnits: number;
  totalSpent: number;
  primaryCurrency: string;
  byPayment: { method: string; count: number; total: number }[];
};

export function orderAmount(order: SavedOrder): number {
  if (typeof order.totalAmount === "number" && !Number.isNaN(order.totalAmount)) {
    return order.totalAmount;
  }
  const fromItems = order.items.reduce((sum, i) => sum + i.priceAmount * i.quantity, 0);
  if (fromItems > 0) return fromItems;
  const digits = order.totalFormatted.replace(/[^\d.,]/g, "");
  const normalized = digits.includes(",") && digits.lastIndexOf(",") > digits.lastIndexOf(".")
    ? digits.replace(/\./g, "").replace(",", ".")
    : digits.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function computeBuyerStats(orders: SavedOrder[]): BuyerPurchaseStats {
  const primaryCurrency = orders[0]?.currency ?? orders[0]?.items[0]?.priceCurrency ?? "USD";
  const paymentMap = new Map<string, { count: number; total: number }>();

  let pendingCount = 0;
  let approvedCount = 0;
  let totalUnits = 0;
  let totalSpent = 0;

  for (const order of orders) {
    if (order.status === "pending") pendingCount += 1;
    else approvedCount += 1;
    totalUnits += order.items.reduce((s, i) => s + i.quantity, 0);
    const amount = roundMoney(orderAmount(order));
    totalSpent += amount;
    const method = order.payment?.type ?? "unknown";
    const prev = paymentMap.get(method) ?? { count: 0, total: 0 };
    paymentMap.set(method, { count: prev.count + 1, total: prev.total + amount });
  }

  return {
    totalOrders: orders.length,
    pendingCount,
    approvedCount,
    totalUnits,
    totalSpent: roundMoney(totalSpent),
    primaryCurrency,
    byPayment: [...paymentMap.entries()].map(([method, v]) => ({ method, ...v })),
  };
}

export type BuyerLedgerRow = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: SavedOrder["status"];
  paymentLabel: string;
  itemSummary: string;
};

export function buildBuyerLedger(orders: SavedOrder[]): BuyerLedgerRow[] {
  return orders.map((order) => ({
    id: order.id,
    date: order.createdAt,
    amount: orderAmount(order),
    currency: order.currency ?? order.items[0]?.priceCurrency ?? "USD",
    status: order.status,
    paymentLabel: order.payment?.type ?? "—",
    itemSummary: order.items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
  }));
}

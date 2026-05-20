import type { FreightOption, PaymentMethod, ShippingAddress } from "@/lib/cart/checkout-types";

export type OrderItem = {
  name: string;
  quantity: number;
  priceAmount: number;
  priceCurrency: string;
  imageUrl?: string;
};

export type SavedOrder = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  address: ShippingAddress;
  freight: FreightOption;
  payment: PaymentMethod;
  totalFormatted: string;
  /** Numeric total for dashboards (optional on legacy orders). */
  totalAmount?: number;
  currency?: string;
  status: "pending" | "approved";
};

const ORDERS_KEY_PREFIX = "nxin_orders:";
const AUTO_APPROVE_MS = 5 * 60 * 1000;

function ordersKey(userId: string): string {
  return `${ORDERS_KEY_PREFIX}${userId}`;
}

function readOrders(userId: string): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ordersKey(userId));
    return raw ? (JSON.parse(raw) as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(userId: string, orders: SavedOrder[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ordersKey(userId), JSON.stringify(orders));
}

export function saveOrder(userId: string, order: SavedOrder): void {
  const orders = readOrders(userId);
  orders.unshift(order);
  writeOrders(userId, orders);
}

export function loadOrders(userId: string): SavedOrder[] {
  const orders = readOrders(userId);
  const now = Date.now();
  let changed = false;

  for (const order of orders) {
    if (order.status === "pending") {
      const elapsed = now - new Date(order.createdAt).getTime();
      if (elapsed >= AUTO_APPROVE_MS) {
        order.status = "approved";
        changed = true;
      }
    }
  }

  if (changed) writeOrders(userId, orders);
  return orders;
}

export function confirmOrder(userId: string, orderId: string): void {
  const orders = readOrders(userId);
  const order = orders.find((o) => o.id === orderId);
  if (order && order.status === "pending") {
    order.status = "approved";
    writeOrders(userId, orders);
  }
}

export function removeOrder(userId: string, orderId: string): boolean {
  const orders = readOrders(userId);
  const next = orders.filter((o) => o.id !== orderId);
  if (next.length === orders.length) return false;
  writeOrders(userId, next);
  return true;
}

export function orderCount(userId: string): number {
  return readOrders(userId).length;
}

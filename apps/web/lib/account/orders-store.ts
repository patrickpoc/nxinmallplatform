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
  status: "pending" | "approved";
};

const ORDERS_KEY = "nxin_orders";
const AUTO_APPROVE_MS = 5 * 60 * 1000;

function readOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: SavedOrder[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function saveOrder(order: SavedOrder): void {
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
}

export function loadOrders(): SavedOrder[] {
  const orders = readOrders();
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

  if (changed) writeOrders(orders);
  return orders;
}

export function confirmOrder(orderId: string): void {
  const orders = readOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order && order.status === "pending") {
    order.status = "approved";
    writeOrders(orders);
  }
}

export function removeOrder(orderId: string): boolean {
  const orders = readOrders();
  const next = orders.filter((o) => o.id !== orderId);
  if (next.length === orders.length) return false;
  writeOrders(next);
  return true;
}

export function orderCount(): number {
  return readOrders().length;
}

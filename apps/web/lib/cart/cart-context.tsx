"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/cart/types";

const STORAGE_KEY = "nxinmall:cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  addItem: (item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is CartLine => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return (
        typeof o.lineId === "string" &&
        typeof o.productId === "string" &&
        typeof o.variantId === "string" &&
        typeof o.name === "string" &&
        typeof o.priceAmount === "number" &&
        (o.priceCurrency === "USD" || o.priceCurrency === "BRL") &&
        typeof o.quantity === "number"
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines, hydrated]);

  const addItem = useCallback((item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => {
    const qty = Math.max(1, Math.floor(item.quantity ?? 1));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === item.productId && l.variantId === item.variantId);
      if (idx >= 0) {
        const next = [...prev];
        const cur = next[idx]!;
        next[idx] = { ...cur, quantity: cur.quantity + qty };
        return next;
      }
      const lineId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const line: CartLine = {
        lineId,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        imageUrl: item.imageUrl,
        priceAmount: item.priceAmount,
        priceCurrency: item.priceCurrency,
        quantity: qty,
        unit: item.unit,
      };
      return [...prev, line];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const n = Math.floor(quantity);
    const q = Number.isNaN(n) ? 1 : Math.max(0, n);
    setLines((prev) => {
      if (q === 0) return prev.filter((l) => l.lineId !== lineId);
      return prev.map((l) => (l.lineId === lineId ? { ...l, quantity: q } : l));
    });
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({ lines, itemCount, addItem, updateQuantity, removeLine, clear }),
    [lines, itemCount, addItem, updateQuantity, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

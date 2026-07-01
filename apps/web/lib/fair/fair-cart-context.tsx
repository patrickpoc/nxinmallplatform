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

function storageKey(slug: string) {
  return `nxinmall:fair-cart:${slug}`;
}

type FairCartContextValue = {
  lines: CartLine[];
  itemCount: number;
  addItem: (item: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

const FairCartContext = createContext<FairCartContextValue | null>(null);

function loadLines(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
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

export function FairCartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadLines(slug));
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines, hydrated, slug]);

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
      const lineId = `${item.productId}:${item.variantId}:${Date.now()}`;
      return [...prev, { ...item, lineId, quantity: qty }];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const qty = Math.max(0, Math.floor(quantity));
    setLines((prev) => {
      if (qty === 0) return prev.filter((l) => l.lineId !== lineId);
      return prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l));
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

  return <FairCartContext.Provider value={value}>{children}</FairCartContext.Provider>;
}

export function useFairCart() {
  const ctx = useContext(FairCartContext);
  if (!ctx) throw new Error("useFairCart must be used within FairCartProvider");
  return ctx;
}

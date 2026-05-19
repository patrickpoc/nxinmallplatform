"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { useDemoTourOptional } from "@/lib/demo/demo-context";

/** Registers cart seeder and keeps demo helpers wired to client stores. */
export function DemoRouteSync() {
  const demo = useDemoTourOptional();
  const { addItem } = useCart();

  useEffect(() => {
    if (!demo) return;
    demo.registerCartSeeder(addItem);
    return () => demo.registerCartSeeder(null);
  }, [demo, addItem]);

  return null;
}

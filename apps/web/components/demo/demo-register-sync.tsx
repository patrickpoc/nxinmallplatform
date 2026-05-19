"use client";

import { useEffect } from "react";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import type { RegisterPrefillHandler } from "@/lib/demo/demo-register-prefill";

type DemoRegisterSyncProps = {
  onPrefill: RegisterPrefillHandler;
};

export function DemoRegisterSync({ onPrefill }: DemoRegisterSyncProps) {
  const demo = useDemoTourOptional();

  useEffect(() => {
    if (!demo) return;
    demo.registerPrefillHandler(onPrefill);
    return () => demo.registerPrefillHandler(null);
  }, [demo, onPrefill]);

  return null;
}

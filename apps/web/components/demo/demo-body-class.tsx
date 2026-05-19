"use client";

import { useEffect } from "react";
import { useDemoTourOptional } from "@/lib/demo/demo-context";

export function DemoBodyClass() {
  const demo = useDemoTourOptional();

  useEffect(() => {
    if (demo?.isActive) {
      document.body.classList.add("demo-tour-active");
    } else {
      document.body.classList.remove("demo-tour-active");
    }
    return () => document.body.classList.remove("demo-tour-active");
  }, [demo?.isActive]);

  return null;
}

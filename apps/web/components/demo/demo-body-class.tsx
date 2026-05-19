"use client";

import { useEffect } from "react";
import { useDemoTourOptional } from "@/lib/demo/demo-context";

export function DemoBodyClass() {
  const demo = useDemoTourOptional();

  useEffect(() => {
    const body = document.body;
    if (demo?.isActive) {
      body.classList.add("demo-tour-active");
      if (demo.surface === "mobile") {
        body.classList.add("demo-pocket");
        if (demo.pocketExpanded) body.classList.add("demo-pocket-expanded");
        else body.classList.remove("demo-pocket-expanded");
      } else {
        body.classList.remove("demo-pocket", "demo-pocket-expanded");
      }
    } else {
      body.classList.remove("demo-tour-active", "demo-pocket", "demo-pocket-expanded");
    }
    return () => body.classList.remove("demo-tour-active", "demo-pocket", "demo-pocket-expanded");
  }, [demo?.isActive, demo?.surface, demo?.pocketExpanded]);

  return null;
}

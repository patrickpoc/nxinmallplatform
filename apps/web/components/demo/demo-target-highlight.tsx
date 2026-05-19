"use client";

import { useEffect } from "react";
import { useDemoTourOptional } from "@/lib/demo/demo-context";

/** Marks the resolved demo target for CSS outline (matches spotlight cutout). */
export function DemoTargetHighlight() {
  const demo = useDemoTourOptional();
  const target =
    demo?.isActive && demo.activeDemoTargetId
      ? demo.activeDemoTargetId
      : demo?.isActive
        ? demo.currentStep.target
        : undefined;

  useEffect(() => {
    if (!demo?.isActive) {
      document.querySelectorAll("[data-demo-active-target]").forEach((el) => {
        el.removeAttribute("data-demo-active-target");
      });
      return;
    }

    document.querySelectorAll("[data-demo-active-target]").forEach((el) => {
      el.removeAttribute("data-demo-active-target");
    });

    if (!target) return;

    const el = document.querySelector(`[data-demo-target="${target}"]`);
    el?.setAttribute("data-demo-active-target", "true");

    return () => {
      el?.removeAttribute("data-demo-active-target");
    };
  }, [demo?.isActive, target, demo?.stepIndex, demo?.activeDemoTargetId]);

  return null;
}

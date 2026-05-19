"use client";

import { DemoBodyClass } from "@/components/demo/demo-body-class";
import { DemoFloatingPanel } from "@/components/demo/demo-floating-panel";
import { DemoFloatingPanelPocket } from "@/components/demo/demo-floating-panel-pocket";
import { DemoOverlay } from "@/components/demo/demo-overlay";
import { DemoRouteSync } from "@/components/demo/demo-route-sync";
import { DemoTargetHighlight } from "@/components/demo/demo-target-highlight";

export function DemoShell() {
  return (
    <>
      <DemoBodyClass />
      <DemoRouteSync />
      <DemoTargetHighlight />
      <DemoOverlay />
      <DemoFloatingPanelPocket />
      <DemoFloatingPanel />
    </>
  );
}

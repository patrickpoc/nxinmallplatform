"use client";

import { PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DemoStartDialog } from "@/components/demo/demo-start-dialog";
import { Button } from "@/components/ui/button";
import { useDemoTourOptional } from "@/lib/demo/demo-context";

type DemoStartButtonProps = {
  variant?: "header" | "menu";
  className?: string;
  onStarted?: () => void;
};

export function DemoStartButton({ variant = "header", className, onStarted }: DemoStartButtonProps) {
  const t = useTranslations("nav");
  const demo = useDemoTourOptional();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!demo) return null;

  function openDialog() {
    if (demo?.isActive) return;
    setDialogOpen(true);
  }

  if (variant === "menu") {
    return (
      <>
        <button
          type="button"
          onClick={openDialog}
          className={className ?? "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-brand-dark hover:bg-surface-light"}
          disabled={demo.isActive}
        >
          <PlayCircle className="h-4 w-4 text-brand-blue" aria-hidden />
          {t("demoTour")}
        </button>
        <DemoStartDialog open={dialogOpen} onOpenChange={setDialogOpen} onStarted={onStarted} />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={className ?? "hidden md:inline-flex"}
        onClick={openDialog}
        disabled={demo.isActive}
      >
        <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden />
        {t("demoTour")}
      </Button>
      <DemoStartDialog open={dialogOpen} onOpenChange={setDialogOpen} onStarted={onStarted} />
    </>
  );
}

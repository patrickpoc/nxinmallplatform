import Image from "next/image";
import { cn } from "@/lib/utils";

type NxinLogoProps = {
  className?: string;
  /** Accessible label for screen readers. */
  label?: string;
  /** Height in pixels (width scales proportionally at 3:1 ratio). */
  height?: number;
};

export function NxinLogo({ className, label = "NxinMall", height = 52 }: NxinLogoProps) {
  const width = Math.round(height * 3);

  return (
    <Image
      src="/brand/nxinmall-logo.svg"
      alt={label}
      width={width}
      height={height}
      className={cn("h-auto object-contain", className)}
      style={{ height: `${height}px`, width: "auto" }}
      priority
    />
  );
}

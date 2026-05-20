import Image from "next/image";
import { cn } from "@/lib/utils";

type NxinLogoProps = {
  className?: string;
  /** Accessible label for screen readers. */
  label?: string;
  /** Height in pixels (width scales with intrinsic aspect ratio). */
  height?: number;
};

/**
 * Uses PNG with transparent background. The legacy SVG embeds a raster with an opaque
 * black matte that shows incorrectly on mobile when optimized by next/image.
 */
export function NxinLogo({ className, label = "NxinMall", height = 52 }: NxinLogoProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center bg-transparent", className)}>
      <Image
        src="/brand/nxinmall-logo.png"
        alt={label}
        width={Math.round(height * 3.2)}
        height={height}
        className="h-auto w-auto max-w-[min(46vw,200px)] object-contain object-left sm:max-w-none"
        style={{ height: `${height}px`, width: "auto" }}
        unoptimized
        priority
      />
    </span>
  );
}

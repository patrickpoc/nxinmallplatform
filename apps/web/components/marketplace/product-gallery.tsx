"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PRODUCT_MEDIA_ASPECT_CLASS } from "@/lib/marketplace/product-media-aspect";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: { url: string }[];
  alt: string;
  aspectClass?: string;
};

export function ProductGallery({ images, alt, aspectClass = PRODUCT_MEDIA_ASPECT_CLASS }: ProductGalleryProps) {
  const urls = useMemo(() => images.map((i) => i.url).filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);
  const current = urls.length > 0 ? urls[Math.min(index, urls.length - 1)]! : null;

  const prev = useCallback(() => {
    if (urls.length === 0) return;
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  }, [urls.length]);

  const next = useCallback(() => {
    if (urls.length === 0) return;
    setIndex((i) => (i + 1) % urls.length);
  }, [urls.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    },
    [prev, next],
  );

  function handleMouseMove(e: React.MouseEvent) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <div className="space-y-3">
      <div
        ref={imgRef}
        className="relative cursor-zoom-in overflow-hidden rounded-xl border border-border bg-white shadow-card"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        role="region"
        aria-roledescription="Image gallery"
        aria-label={alt}
      >
        <div className={cn("relative", aspectClass)}>
          {current ? (
            <Image
              src={current}
              alt={alt}
              fill
              className={cn(
                "object-contain p-6 transition-transform duration-200",
                zoomed && "scale-[2]",
              )}
              style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              sizes="(max-width: 1023px) 100vw, (max-width: 1152px) 46vw, 560px"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-gray">
              <ImageOff className="h-10 w-10 opacity-40" aria-hidden />
            </div>
          )}
        </div>
        {urls.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
              aria-label="Next image"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>
          </>
        ) : null}
      </div>

      {urls.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition-all",
                i === index ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-border hover:border-brand-gray/40",
              )}
              aria-label={`Image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              <Image src={u} alt="" fill className="object-contain p-1" sizes="64px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

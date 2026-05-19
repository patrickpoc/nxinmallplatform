"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type SlideConfig = {
  src: string;
  alt: string;
  categorySlug: string;
  headline: Record<string, string>;
  sub: Record<string, string>;
  cta: Record<string, string>;
  align: "left" | "right";
};

const SLIDES: SlideConfig[] = [
  {
    src: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1600&h=600&fit=crop&q=80",
    alt: "Tractors and harvesters in an open field",
    categorySlug: "equipment",
    headline: {
      en: "Heavy equipment for every harvest",
      pt: "Equipamentos pesados para cada colheita",
      zh: "为每次收获准备的重型设备",
    },
    sub: {
      en: "Tractors, harvesters and implements from top manufacturers.",
      pt: "Tratores, colheitadeiras e implementos dos melhores fabricantes.",
      zh: "来自顶级制造商的拖拉机、收割机和农具。",
    },
    cta: { en: "Shop equipment", pt: "Ver equipamentos", zh: "查看设备" },
    align: "left",
  },
  {
    src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&h=600&fit=crop&q=80",
    alt: "Lush green soybean field",
    categorySlug: "seeds",
    headline: {
      en: "Premium seeds, proven yields",
      pt: "Sementes premium, produtividade comprovada",
      zh: "优质种子，经过验证的产量",
    },
    sub: {
      en: "Certified seeds for soy, corn, wheat and specialty crops.",
      pt: "Sementes certificadas de soja, milho, trigo e culturas especiais.",
      zh: "经认证的大豆、玉米、小麦和特种作物种子。",
    },
    cta: { en: "Shop seeds", pt: "Ver sementes", zh: "查看种子" },
    align: "right",
  },
  {
    src: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&h=600&fit=crop&q=80",
    alt: "Farmer spraying fertilizer on crops",
    categorySlug: "agri-inputs",
    headline: {
      en: "Inputs that boost your crop",
      pt: "Insumos que potencializam sua lavoura",
      zh: "提升产量的农业投入品",
    },
    sub: {
      en: "Fertilizers, pesticides and soil amendments at competitive prices.",
      pt: "Fertilizantes, defensivos e corretivos com preços competitivos.",
      zh: "具有竞争力价格的肥料、农药和土壤改良剂。",
    },
    cta: { en: "Shop inputs", pt: "Ver insumos", zh: "查看投入品" },
    align: "left",
  },
  {
    src: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1600&h=600&fit=crop&q=80",
    alt: "Smart farming technology with drones",
    categorySlug: "technology",
    headline: {
      en: "Smart tech for modern farming",
      pt: "Tecnologia inteligente para o agro moderno",
      zh: "现代农业智能科技",
    },
    sub: {
      en: "Drones, sensors, precision agriculture and farm management software.",
      pt: "Drones, sensores, agricultura de precisão e softwares de gestão.",
      zh: "无人机、传感器、精准农业和农场管理软件。",
    },
    cta: { en: "Shop technology", pt: "Ver tecnologia", zh: "查看科技" },
    align: "right",
  },
  {
    src: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&h=600&fit=crop&q=80",
    alt: "Golden wheat field at sunset",
    categorySlug: "feed",
    headline: {
      en: "Quality feed for livestock",
      pt: "Ração de qualidade para o rebanho",
      zh: "优质畜牧饲料",
    },
    sub: {
      en: "Animal nutrition, supplements and feed concentrates from trusted brands.",
      pt: "Nutrição animal, suplementos e concentrados de marcas confiáveis.",
      zh: "来自可信品牌的动物营养品、补充剂和浓缩饲料。",
    },
    cta: { en: "Shop feed", pt: "Ver ração", zh: "查看饲料" },
    align: "left",
  },
];

const INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;

type HeroBannerProps = {
  categories: { id: string; slug: string; name: unknown }[];
};

export function HeroBanner({ categories }: HeroBannerProps) {
  const locale = useLocale() as "en" | "pt" | "zh";
  const t = useTranslations("marketplaceHome");
  const [index, setIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slugToId: Record<string, string> = {};
  for (const c of categories) {
    slugToId[c.slug] = c.id;
  }

  const total = SLIDES.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, INTERVAL_MS);
  }, [next]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetAutoplay]);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function goToSlide(i: number) {
    setIndex(i);
    resetAutoplay();
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
    resetAutoplay();
  }

  const parallaxOffset = scrollY * 0.25;

  return (
    <section className="relative" data-demo-target="hero">
      <div
        className="relative h-[38vh] w-full touch-pan-y overflow-hidden sm:h-[45vh] md:h-[60vh] lg:h-[65vh]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              transform: `translateY(${parallaxOffset}px)`,
            }}
            aria-hidden={i !== index}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              className="object-cover"
              style={{ objectPosition: "center 35%" }}
              sizes="100vw"
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {SLIDES.map((slide, i) => {
          const catId = slugToId[slide.categorySlug];
          const href = catId ? `/products?category=${catId}` : `/products`;

          return (
            <div
              key={slide.categorySlug}
              className={`absolute inset-0 z-10 flex items-center transition-opacity duration-500 ${i === index ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} ${slide.align === "right" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl space-y-3 px-6 sm:space-y-4 sm:px-10 md:px-16 lg:px-20 ${slide.align === "right" ? "text-right" : "text-left"}`}
                style={i === index ? { animation: "hereFadeIn 0.6s ease-out both" } : undefined}
              >
                <h2 className="text-xl font-extrabold uppercase leading-tight tracking-wide text-white drop-shadow-lg sm:text-2xl md:text-4xl lg:text-5xl">
                  {slide.headline[locale] ?? slide.headline.en}
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-white/90 drop-shadow sm:text-base md:text-lg">
                  {slide.sub[locale] ?? slide.sub.en}
                </p>
                <div className={`flex w-full flex-col gap-2 pt-1 sm:w-auto ${slide.align === "right" ? "sm:items-end" : ""}`}>
                  <Button
                    asChild
                    size="lg"
                    className="btn-press w-full rounded-md bg-green-600 px-7 py-3 text-sm font-semibold shadow-lg transition-colors hover:bg-green-700 sm:w-auto sm:text-base"
                  >
                    <Link href={href}>{slide.cta[locale] ?? slide.cta.en}</Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => {
            prev();
            resetAutoplay();
          }}
          className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition-colors hover:bg-black/50 md:left-5 md:flex md:h-12 md:w-12"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          type="button"
          onClick={() => {
            next();
            resetAutoplay();
          }}
          className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white shadow backdrop-blur-sm transition-colors hover:bg-black/50 md:right-5 md:flex md:h-12 md:w-12"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-6">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/80 md:hidden">{t("heroSwipeHint")}</p>
          <div className="flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.categorySlug}
                type="button"
                onClick={() => goToSlide(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-white shadow" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
                aria-label={`Slide ${i + 1} – ${s.cta[locale] ?? s.cta.en}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes hereFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

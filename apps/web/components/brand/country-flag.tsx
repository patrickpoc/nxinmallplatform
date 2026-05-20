import Image from "next/image";
import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code: string;
  className?: string;
  size?: "sm" | "md";
};

/** ISO 3166-1 alpha-2 flag — image CDN for consistent rendering (incl. Windows). */
export function CountryFlag({ code, className, size = "sm" }: CountryFlagProps) {
  const upper = code.slice(0, 2).toUpperCase();
  const lower = upper.toLowerCase();
  const dims = size === "md" ? { w: 24, h: 18, tw: "h-[18px] w-6" } : { w: 20, h: 15, tw: "h-[15px] w-5" };

  return (
    <Image
      src={`https://flagcdn.com/w40/${lower}.png`}
      alt=""
      width={dims.w}
      height={dims.h}
      className={cn("inline-block shrink-0 rounded-sm object-cover shadow-sm", dims.tw, className)}
      unoptimized
      aria-hidden
    />
  );
}

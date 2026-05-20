import { CountryFlag } from "@/components/brand/country-flag";
import { countryLabel } from "@/lib/geo/country-label";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  locale: string;
  className?: string;
  flagSize?: "sm" | "md";
};

/** Flag image + localized country name (supplier-style, no duplicate ISO codes). */
export function CountryDisplay({ code, locale, className, flagSize = "sm" }: Props) {
  if (!code) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-brand-gray", className)}>
      <CountryFlag code={code} size={flagSize} />
      <span>{countryLabel(code, locale)}</span>
    </span>
  );
}

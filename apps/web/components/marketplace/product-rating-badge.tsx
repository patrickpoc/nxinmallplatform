import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  average: number;
  count: number;
  label: string;
  className?: string;
};

export function ProductRatingBadge({ average, count, label, className }: Props) {
  if (count <= 0) return null;

  return (
    <p className={cn("flex items-center gap-1 text-xs text-brand-gray", className)}>
      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-medium text-brand-dark">{label}</span>
    </p>
  );
}

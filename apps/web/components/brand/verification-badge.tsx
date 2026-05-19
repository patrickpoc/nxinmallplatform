import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tierCopy: Record<string, "default" | "secondary" | "success" | "warning"> = {
  UNVERIFIED: "secondary",
  BASIC: "secondary",
  VERIFIED: "success",
  PREMIUM: "warning",
};

type VerificationBadgeProps = {
  tier: string;
  className?: string;
};

/** Compact verification pill for company and product surfaces. */
export function VerificationBadge({ tier, className }: VerificationBadgeProps) {
  const variant = tierCopy[tier] ?? "secondary";
  return (
    <Badge variant={variant} className={cn("uppercase tracking-wide", className)}>
      {tier.replaceAll("_", " ")}
    </Badge>
  );
}

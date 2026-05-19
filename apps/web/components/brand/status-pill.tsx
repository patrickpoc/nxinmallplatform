import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING: "warning",
  OPEN: "secondary",
  ACTIVE: "success",
  DRAFT: "outline",
  DELIVERED: "success",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
};

type StatusPillProps = {
  status: string;
  className?: string;
};

/** Order/RFQ/product status chip with semantic coloring. */
export function StatusPill({ status, className }: StatusPillProps) {
  const variant = statusVariant[status] ?? "outline";
  return (
    <Badge variant={variant} className={cn("font-mono text-xs", className)}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

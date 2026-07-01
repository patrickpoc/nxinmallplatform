import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function FairPageSpinner({ className, compact }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "py-4" : "min-h-[40vh] py-16",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
    </div>
  );
}

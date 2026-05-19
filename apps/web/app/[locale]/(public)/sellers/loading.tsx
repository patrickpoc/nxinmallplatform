import { Skeleton } from "@/components/ui/skeleton";

export default function SellersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-32" />
            <div className="mt-3 flex gap-4 border-t border-border pt-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

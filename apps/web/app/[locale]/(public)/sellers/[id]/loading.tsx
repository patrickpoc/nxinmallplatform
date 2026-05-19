import { Skeleton } from "@/components/ui/skeleton";

export default function SellerProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[300px]">
          <div className="rounded-lg border border-border bg-white p-6 shadow-card">
            <div className="space-y-4">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2 border-t border-border pt-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-white shadow-card">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

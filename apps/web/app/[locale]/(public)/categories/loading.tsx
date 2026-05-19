import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16 md:px-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-5 shadow-card">
            <Skeleton className="mb-3 h-5 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

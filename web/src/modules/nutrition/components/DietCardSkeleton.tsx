import { Skeleton } from "@/shared/components/ui/Skeleton";

export function DietCardSkeleton() {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

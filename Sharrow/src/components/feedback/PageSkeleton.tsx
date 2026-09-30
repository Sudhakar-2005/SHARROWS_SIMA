import { Skeleton, SkeletonText } from '@/design/primitives'

/** Route-level loading frame — communicates structure while pages hydrate. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6 lg:p-8" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton variant="text" width="120px" />
        <Skeleton variant="text" width="280px" height="28px" />
        <Skeleton variant="text" width="420px" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-32 rounded-md border border-line bg-surface-1 p-4">
          <SkeletonText lines={3} />
        </div>
        <div className="h-32 rounded-md border border-line bg-surface-1 p-4">
          <SkeletonText lines={3} />
        </div>
        <div className="h-32 rounded-md border border-line bg-surface-1 p-4">
          <SkeletonText lines={3} />
        </div>
      </div>
      <Skeleton variant="chart" height={260} />
    </div>
  )
}

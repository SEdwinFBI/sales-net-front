import { Skeleton } from '@/components/ui/skeleton'

const SkeletonProductCard = () => {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-6 w-9 rounded-lg" />
          <Skeleton className="h-6 w-9 rounded-lg" />
          <Skeleton className="h-6 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductCard

import { Skeleton } from '@/components/ui/skeleton'

const SkeletonProductCard = () => {
    return (
        <div className="h-full overflow-hidden rounded-[1rem] bg-card shadow-sm animate-pulse">
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-muted" />
            <div className="space-y-3 p-3">
                <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-muted" />
                    <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded-full bg-muted" />
                <Skeleton className="h-5 w-1/2 rounded-full bg-muted" />
            </div>

        </div>
    )
}

export default SkeletonProductCard

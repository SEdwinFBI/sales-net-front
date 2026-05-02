import { Skeleton } from '@/components/ui/skeleton'

const SkeletonProductCard = () => {
    return (
        <div className="max-h-80 space-y-4 rounded-4xl  bg-gray-100 p-4 shadow-sm animate-pulse">
            <div className="flex mt-40 items-center justify-between gap-2">
                <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <Skeleton className="h-5 w-3/4 rounded-full bg-gray-200" />
            <Skeleton className="h-5 w-1/2 rounded-full bg-gray-200" />

        </div>
    )
}

export default SkeletonProductCard
import { useCallback } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FC } from "react"
import type { Product } from "@/features/sales/types/sales"
import imageUrl from '@/assets/img.jpg'
import { cn } from '@/lib/utils'
import { getStockBadgeClass, getStockTextClass } from '@/lib/stock-status'

type Props = {
    item: Product
    onClick?: () => void
}

const ProductCard: FC<Props> = ({ item, onClick }) => {
    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = imageUrl
    }, [])

    const maxPrice = item.variants.length > 1
        ? Math.max(...item.variants.map(v => v.price))
        : item.variants[0]?.price
    const hasPriceRange = item.variants.length > 1 && item.variants[0]?.price !== maxPrice
    const totalStock = item.variants.reduce((s, v) => s + v.stock, 0)

    return (
        <Card size="sm" className="h-full w-full cursor-pointer bg-white py-0 transition-shadow hover:shadow-md" onClick={onClick}>
            <img className="aspect-[4/3] w-full object-cover object-center" src={item.image ?? imageUrl} onError={handleImageError} />
            <CardHeader className="gap-1.5 px-3 pb-3">
                <Badge variant="secondary" className="max-w-full truncate text-xs">{item.category}</Badge>
                <CardTitle className="line-clamp-2 text-sm leading-tight sm:text-[0.95rem]">{item.name}</CardTitle>
                <CardDescription>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs leading-snug sm:text-[0.82rem]">
                            <small className={cn("font-medium", getStockTextClass(totalStock))}>
                                Desde Q.{item.variants[0]?.price}
                                {hasPriceRange && <> a Q.{maxPrice} </>}
                                en stock {totalStock}
                            </small>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {item.variants.map(v => (
                                <Badge
                                    key={v.id}
                                        variant="default"
                                    className={cn("min-h-6 min-w-9 px-2.5 text-[0.72rem] leading-none tabular-nums", getStockBadgeClass(v.stock))}
                                >
                                    {v.size}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
    )
}

export default ProductCard

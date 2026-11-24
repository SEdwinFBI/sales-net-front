import { useCallback } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FC } from 'react'
import type { Product } from '@/features/sales/types/sales'
import imageUrl from '@/assets/img.jpg'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/helpers/money'
import { getStockBadgeClass, getStockStatus, getStockTextClass } from '@/lib/stock-status'
import StockLevelMeter from './StockLevelMeter'

type Props = {
  item: Product
  onClick?: () => void
  showStockMeter?: boolean
}

const ProductCard: FC<Props> = ({ item, onClick, showStockMeter = false }) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = imageUrl
  }, [])

  const prices = item.variants.map((v) => v.price).filter(Number.isFinite)
  const minPrice = prices.length > 0 ? Math.min(...prices) : (item.variants[0]?.price ?? 0)
  const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice
  const hasPriceRange = item.variants.length > 1 && minPrice !== maxPrice
  const totalStock = item.variants.reduce((s, v) => s + v.stock, 0)
  const stockStatus = getStockStatus(totalStock)

  return (
    <Card
      size="sm"
      className="group h-full w-full cursor-pointer gap-0 border-border/80 bg-card py-0 data-[size=sm]:py-0 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
        <img
          className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
          src={item.image ?? imageUrl}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 bg-gradient-to-b from-slate-950/45 via-slate-950/15 to-transparent p-2">
          <Badge
            variant="secondary"
            className="max-w-[65%] truncate border-white/25 bg-white/90 text-[10px] font-semibold text-slate-800 shadow-2xs backdrop-blur-xs dark:bg-slate-900/85 dark:text-slate-100"
          >
            {item.category}
          </Badge>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums shadow-2xs backdrop-blur-xs',
              stockStatus === 'out'
                ? 'bg-destructive/90 text-white'
                : stockStatus === 'low'
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-slate-900/75 text-white',
            )}
          >
            {totalStock > 0 ? `${totalStock} uds` : 'Agotado'}
          </span>
        </div>
      </div>

      <CardHeader className="flex flex-1 flex-col justify-between gap-2 px-3 py-3">
        <CardTitle className="line-clamp-2 text-[0.875rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {item.name}
        </CardTitle>

        <CardDescription className="space-y-2">
          <div className="flex items-baseline justify-between gap-1.5">
            <span className="font-heading text-sm font-bold text-primary tabular-nums sm:text-[0.95rem]">
              {formatCurrency(minPrice)}
              {hasPriceRange && (
                <span className="text-xs font-semibold text-muted-foreground"> – {formatCurrency(maxPrice)}</span>
              )}
            </span>
            {stockStatus !== 'available' && (
              <span className={cn('text-[10.5px] font-semibold', getStockTextClass(totalStock))}>
                {stockStatus === 'out' ? 'Sin stock' : 'Stock bajo'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {item.variants.map((v) => (
              <Badge
                key={v.id}
                variant="outline"
                className={cn(
                  'min-h-5.5 min-w-7 rounded-md px-1.5 text-[0.68rem] font-semibold leading-none tabular-nums',
                  getStockBadgeClass(v.stock),
                )}
              >
                {v.size}
              </Badge>
            ))}
          </div>
        </CardDescription>
      </CardHeader>
      {showStockMeter && <div className="border-t border-border/60 px-3 py-2.5">
        <StockLevelMeter quantity={totalStock} />
      </div>}
    </Card>
  )
}

export default ProductCard

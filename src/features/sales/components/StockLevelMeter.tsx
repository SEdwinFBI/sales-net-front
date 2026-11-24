import { getStockStatus, LOW_STOCK_THRESHOLD } from '@/lib/stock-status'
import { cn } from '@/lib/utils'

const levels = [
  { status: 'out', label: 'Sin stock', active: 'bg-red-500' },
  { status: 'low', label: 'Stock bajo', active: 'bg-amber-400' },
  { status: 'available', label: 'Disponible', active: 'bg-emerald-500' },
] as const

/** Indicador de estado, no porcentaje: no existe una capacidad máxima de stock. */
export default function StockLevelMeter({ quantity }: { quantity: number }) {
  const status = getStockStatus(quantity)
  const level = levels.find((item) => item.status === status)!

  return (
    <div role="img" aria-label={`Stock general: ${quantity} unidades. ${level.label}. Stock bajo hasta ${LOW_STOCK_THRESHOLD} unidades.`}
      className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
        <span className="font-medium text-muted-foreground">{quantity} {quantity === 1 ? 'unidad en total' : 'unidades en total'}</span>
        <span className={cn('font-semibold tabular-nums',
          status === 'out' ? 'text-red-600 dark:text-red-400' :
            status === 'low' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400')}>
          {level.label}
        </span>
      </div>
      <div className={cn('h-2 rounded-full', level.active)} aria-hidden="true" />
    </div>
  )
}

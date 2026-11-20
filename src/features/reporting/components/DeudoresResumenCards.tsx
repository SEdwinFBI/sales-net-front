import { Users, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber } from '@/helpers/money'
import type { ReporteDeudores } from '../types/reportes'

type Props = {
  resumen?: ReporteDeudores['data']['resumen']
  isLoading: boolean
}

export default function DeudoresResumenCards({ resumen, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!resumen) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 pl-5 shadow-card transition-shadow hover:shadow-card-hover">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Total deudores
          </p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
            <Users className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
          {formatNumber(resumen.total_deudores)}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 pl-5 shadow-card transition-shadow hover:shadow-card-hover">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-destructive" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Total adeudado
          </p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 font-heading text-2xl font-bold text-destructive tabular-nums">
          {formatCurrency(Number(resumen.total_adeudado))}
        </p>
      </div>
    </div>
  )
}

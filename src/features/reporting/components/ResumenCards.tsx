import { Boxes, Percent, Receipt, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber } from '@/helpers/money'
import { cn } from '@/lib/utils'
import type { ReporteResumen } from '../types/reportes'
import { desgloseOrigen } from '../utils/origen'

type Props = {
  resumen?: ReporteResumen
  isLoading: boolean
}

export default function ResumenCards({ resumen, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!resumen) return null

  const origen = resumen.por_origen
  const SOLO_POS = 'Solo POS'
  const cards: {
    label: string
    value: string
    sub?: string
    color: string
    bar: string
    chip: string
    icon: typeof Receipt
  }[] = [
    {
      label: 'Total bruto',
      value: formatCurrency(Number(resumen.total_bruto)),
      sub: origen ? SOLO_POS : undefined,
      color: 'text-primary',
      bar: 'bg-primary',
      chip: 'bg-primary/12 text-primary',
      icon: Receipt,
    },
    {
      label: 'Total neto',
      // El valor principal es el global (POS + ventas registradas en el cliente); debajo, el desglose.
      value: formatCurrency(Number(origen?.global.total_neto ?? resumen.total_neto)),
      sub: desgloseOrigen(origen, 'total_neto', formatCurrency) ?? undefined,
      color: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
      icon: TrendingUp,
    },
    {
      label: 'Unidades vendidas',
      value: formatNumber(resumen.cantidad_total),
      sub: origen ? SOLO_POS : undefined,
      color: 'text-foreground',
      bar: 'bg-sky-500',
      chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
      icon: Boxes,
    },
    {
      label: 'Total descuento',
      value: formatCurrency(Number(resumen.total_descuento)),
      sub: origen ? SOLO_POS : undefined,
      color: 'text-destructive',
      bar: 'bg-destructive',
      chip: 'bg-destructive/12 text-destructive',
      icon: Percent,
    },
  ]

  return (
    <div className="space-y-2">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 pl-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', card.bar)} />
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {card.label}
              </p>
              <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', card.chip)}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <p className={cn('mt-2 font-heading text-2xl font-bold tabular-nums', card.color)}>
              {card.value}
            </p>
            {card.sub && <p className="mt-1 truncate text-[11px] text-muted-foreground tabular-nums">{card.sub}</p>}
          </div>
        )
      })}
    </div>
    {origen?.nota && <p className="text-xs text-muted-foreground">{origen.nota}</p>}
    </div>
  )
}

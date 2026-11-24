import { ArrowDownLeft, ArrowUpRight, Banknote, Scale, Wallet } from 'lucide-react'
import { formatCurrency } from '@/helpers/money'
import { cn } from '@/lib/utils'
import type { Caja } from '../types/cash'
import { useAuthStore } from '@/features/core/store/auth-store'

type CashSummaryData = Pick<Caja, 'entradas' | 'salidas' | 'ventas_efectivo' | 'efectivo_esperado'>

export function CashSummary({ caja, expectedLabel = 'Saldo esperado' }: { caja: CashSummaryData; expectedLabel?: string }) {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const entradas = Number(caja.entradas) || 0
  const gastos = Number(caja.salidas) || 0
  const resto = entradas - gastos

  const items = [
    {
      label: 'Entradas',
      value: caja.entradas,
      color: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
      icon: ArrowDownLeft,
    },
    {
      label: 'Gastos',
      value: caja.salidas,
      color: 'text-destructive',
      bar: 'bg-destructive',
      chip: 'bg-destructive/12 text-destructive',
      icon: ArrowUpRight,
    },
    {
      label: 'Resto',
      value: resto,
      color: resto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
      bar: resto >= 0 ? 'bg-teal-500' : 'bg-destructive',
      chip: resto >= 0 ? 'bg-teal-500/12 text-teal-600 dark:text-teal-400' : 'bg-destructive/12 text-destructive',
      icon: Scale,
    },
    {
      label: 'Ventas efectivo',
      value: caja.ventas_efectivo,
      color: 'text-primary',
      bar: 'bg-primary',
      chip: 'bg-primary/12 text-primary',
      icon: Banknote,
      adminOnly: true,
    },
    {
      label: expectedLabel,
      value: caja.efectivo_esperado,
      color: 'text-foreground',
      bar: 'bg-amber-500',
      chip: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
      icon: Wallet,
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 md:grid-cols-3', isAdmin && 'lg:grid-cols-5')}>
      {items.map(({ label, value, color, bar, chip, icon: Icon }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 pl-4 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', bar)} />
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </p>
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', chip)}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <p className={cn('mt-2 font-heading text-xl font-bold tabular-nums', color)}>
            {value === undefined ? '—' : formatCurrency(Number(value))}
          </p>
        </div>
      ))}
    </div>
  )
}

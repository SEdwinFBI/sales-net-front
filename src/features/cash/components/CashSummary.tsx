import { formatCurrency } from '@/helpers/money'
import type { Caja } from '../types/cash'

type CashSummaryData = Pick<Caja, 'entradas' | 'salidas' | 'ventas_efectivo' | 'efectivo_esperado'>

export function CashSummary({ caja, expectedLabel = 'Saldo esperado' }: { caja: CashSummaryData; expectedLabel?: string }) {
  const entradas = Number(caja.entradas) || 0
  const gastos = Number(caja.salidas) || 0
  const resto = entradas - gastos

  const items = [
    { label: 'Entradas', value: caja.entradas, color: 'text-emerald-600' },
    { label: 'Gastos', value: caja.salidas, color: 'text-destructive' },
    { label: 'Resto', value: resto, color: resto >= 0 ? 'text-emerald-600' : 'text-destructive' },
    { label: 'Ventas efectivo', value: caja.ventas_efectivo, color: 'text-primary' },
    { label: expectedLabel, value: caja.efectivo_esperado, color: '' },
  ]
  return <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
    {items.map(({ label, value, color }) => <div key={label} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{formatCurrency(Number(value))}</p>
    </div>)}
  </div>
}

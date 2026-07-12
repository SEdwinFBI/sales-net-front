import type { ReporteResumen } from '../types/reportes'

type Props = {
  resumen?: ReporteResumen
  isLoading: boolean
}

export default function ResumenCards({ resumen, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border/70 bg-card p-4">
            <div className="h-3 w-20 rounded bg-muted mb-2" />
            <div className="h-6 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!resumen) return null

  const cards = [
    { label: 'Total bruto', value: `Q${Number(resumen.total_bruto).toFixed(2)}`, color: 'text-primary' },
    { label: 'Total neto', value: `Q${Number(resumen.total_neto).toFixed(2)}`, color: 'text-emerald-600' },
    { label: 'Cantidad total de Unidades', value: resumen.cantidad_total, color: '' },
    { label: 'Total descuento', value: `Q${Number(resumen.total_descuento).toFixed(2)}`, color: 'text-destructive' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}

import type { ReporteDeudores } from '../types/reportes'

type Props = {
  resumen?: ReporteDeudores['data']['resumen']
  isLoading: boolean
}

export default function DeudoresResumenCards({ resumen, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-white p-4">
            <div className="h-3 w-20 rounded bg-muted mb-2" />
            <div className="h-6 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!resumen) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-xs text-muted-foreground">Total deudores</p>
        <p className="text-2xl font-bold mt-1">{resumen.total_deudores}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-xs text-muted-foreground">Total adeudado</p>
        <p className="text-2xl font-bold text-red-600 mt-1">Q{Number(resumen.total_adeudado).toFixed(2)}</p>
      </div>
    </div>
  )
}

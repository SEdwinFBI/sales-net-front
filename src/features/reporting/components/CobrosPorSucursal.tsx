import { ChevronDown, Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/helpers/money'
import CobrosPorUsuarioTable from './CobrosPorUsuarioTable'
import type { ReporteCobrosFilters, ReporteCobrosSucursal } from '../types/reportes'

type Props = {
  data: ReporteCobrosSucursal[]
  isLoading: boolean
  onDownloadUserPdf: (filters: ReporteCobrosFilters) => void
  pdfUserLoading?: number | null
  fecha?: string
  fechaDesde?: string
  fechaHasta?: string
}

export default function CobrosPorSucursal({ data, isLoading, onDownloadUserPdf, pdfUserLoading, fecha, fechaDesde, fechaHasta }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Cargando cobros">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin cobros registrados"
        description="Ajusta el filtro de fecha o usuario para consultar otros abonos."
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((sucursal) => (
        <details
          key={sucursal.id_sucursal ?? 'sin-sucursal'}
          className="group min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card transition-shadow open:shadow-card-hover"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-muted/35 [&::-webkit-details-marker]:hidden">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-open:bg-primary/12 group-open:text-primary">
              <ChevronDown className="size-4 -rotate-90 transition-transform duration-150 group-open:rotate-0" />
            </span>
            <span className="min-w-0 flex-1 break-words font-heading text-sm font-semibold text-foreground">
              {sucursal.nombre}
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total cobrado
              </span>
              <span className="font-heading text-base font-bold text-primary tabular-nums">
                {formatCurrency(sucursal.total_abonado)}
              </span>
            </span>
          </summary>
          <div className="min-w-0 space-y-3 border-t border-border/60 bg-muted/15 p-3 sm:p-4">
            <CobrosPorUsuarioTable
              data={sucursal.por_usuario}
              isLoading={false}
              onDownloadUserPdf={(filters) =>
                onDownloadUserPdf({ ...filters, id_sucursal: sucursal.id_sucursal ?? 'sin_sucursal' })
              }
              pdfUserLoading={pdfUserLoading}
              fecha={fecha}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
            />
          </div>
        </details>
      ))}
    </div>
  )
}

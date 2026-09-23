import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/helpers/money'
import CobrosPorUsuarioTable from './CobrosPorUsuarioTable'
import type { ReporteCobrosFilters, ReporteCobrosSucursal } from '../types/reportes'

type Props = {
  data: ReporteCobrosSucursal[]
  isLoading: boolean
  onDownloadUserPdf: (filters: ReporteCobrosFilters) => void
  pdfUserLoading?: number | null
  fecha?: string
}

export default function CobrosPorSucursal({ data, isLoading, onDownloadUserPdf, pdfUserLoading, fecha }: Props) {
  if (isLoading) return <div className="h-32 animate-pulse rounded-xl border bg-muted" aria-label="Cargando cobros" />
  if (!data.length) return <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Sin resultados</div>

  return (
    <div className="space-y-3">
      {data.map((sucursal) => (
        <details key={sucursal.id_sucursal ?? 'sin-sucursal'} className="group min-w-0 rounded-xl border border-border/70 bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 shrink-0 -rotate-90 transition-transform group-open:rotate-0" />
            <span className="min-w-0 flex-1 break-words text-sm font-medium">{sucursal.nombre}</span>
            <span className="shrink-0 text-right">
              <span className="block text-xs text-muted-foreground">Total cobrado</span>
              <span className="text-sm font-semibold">{formatCurrency(sucursal.total_abonado)}</span>
            </span>
          </summary>
          <div className="min-w-0 space-y-3 border-t p-2 sm:p-4">
            <CobrosPorUsuarioTable
              data={sucursal.por_usuario}
              isLoading={false}
              onDownloadUserPdf={(filters) => onDownloadUserPdf({ ...filters, id_sucursal: sucursal.id_sucursal ?? 'sin_sucursal' })}
              pdfUserLoading={pdfUserLoading}
              fecha={fecha}
            />
          </div>
        </details>
      ))}
    </div>
  )
}

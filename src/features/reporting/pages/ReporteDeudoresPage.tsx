import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useReporteDeudores } from '../hooks/useReporteDeudores'
import DeudoresResumenCards from '../components/DeudoresResumenCards'
import DeudoresTable from '../components/DeudoresTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileDown, MapPin, RotateCcw, Search } from 'lucide-react'
import { downloadReporteDeudoresPdf } from '../services/reportes-service'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import type { ReporteDeudoresFilters } from '../types/reportes'

export default function ReporteDeudoresPage() {
  const [filters, setFilters] = useState<ReporteDeudoresFilters>({})
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')
  const activeFilters = hasFilters ? filters : undefined
  const { clientes, resumen, isLoading } = useReporteDeudores(activeFilters)
  const [pdfLoading, setPdfLoading] = useState(false)

  const setFilter = (key: keyof ReporteDeudoresFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value !== undefined && value !== '' ? value : undefined }))
  }

  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadReporteDeudoresPdf(activeFilters)
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('Error al descargar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <PageTemplateSimple title="Reporte de Deudores" description="Clientes con saldo pendiente.">

      <Card className="p-3.5 sm:p-5">

        <div className="grid grid-cols-1 items-end gap-3 rounded-2xl p-3 min-[480px]:grid-cols-2 sm:p-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] shadow-sm">
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Notificación desde</label>
            <Input
              type="date"
              value={filters.fecha_desde ?? ''}
              onChange={(e) => setFilter('fecha_desde', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Notificación hasta</label>
            <Input
              type="date"
              value={filters.fecha_hasta ?? ''}
              onChange={(e) => setFilter('fecha_hasta', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Nombre</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.nombre ?? ''}
                onChange={(e) => setFilter('nombre', e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full pl-9"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Lugar</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.lugar ?? ''}
                onChange={(e) => setFilter('lugar', e.target.value)}
                placeholder="Direccion o lugar..."
                className="w-full pl-9"
              />
            </div>
          </div>
          <div className="flex min-w-0 gap-2 self-end">
            {hasFilters && (
              <Button variant="secondary" size="sm" onClick={() => setFilters({})} className="h-9 shrink-0">
                <RotateCcw />
              </Button>
            )}
            <Button onClick={handleExportPdf} disabled={pdfLoading} className="h-9 flex-1">
              <FileDown />
              {pdfLoading ? 'Descargando...' : 'Descargar'}
            </Button>
          </div>
        </div>
        <DeudoresResumenCards resumen={resumen} isLoading={isLoading} />
        <DeudoresTable data={clientes} isLoading={isLoading} />
      </Card>

    </PageTemplateSimple >
  )
}

import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useReporteDeudores } from '../hooks/useReporteDeudores'
import DeudoresResumenCards from '../components/DeudoresResumenCards'
import DeudoresTable from '../components/DeudoresTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileDown, RotateCcw, Search } from 'lucide-react'
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

  const setFilter = (key: keyof ReporteDeudoresFilters, value: string | number | undefined) => {
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

        <div className="grid grid-cols-1 items-end gap-3 rounded-2xl p-3 min-[480px]:grid-cols-2 sm:p-4 md:grid-cols-3 lg:grid-cols-8 shadow-sm">
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label>
            <Input
              type="date"
              value={filters.fecha_desde ?? ''}
              onChange={(e) => setFilter('fecha_desde', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label>
            <Input
              type="date"
              value={filters.fecha_hasta ?? ''}
              onChange={(e) => setFilter('fecha_hasta', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Vendedor</label>
            <Input
              type="number"
              min="1"
              value={filters.id_vendedor ?? ''}
              onChange={(e) => setFilter('id_vendedor', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ID"
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
            <Input
              type="number"
              min="1"
              value={filters.id_cliente ?? ''}
              onChange={(e) => setFilter('id_cliente', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ID"
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Saldo min.</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={filters.saldo_min ?? ''}
              onChange={(e) => setFilter('saldo_min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Saldo max.</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={filters.saldo_max ?? ''}
              onChange={(e) => setFilter('saldo_max', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search ?? ''}
                onChange={(e) => setFilter('search', e.target.value)}
                placeholder="Nombre, telefono o ID..."
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

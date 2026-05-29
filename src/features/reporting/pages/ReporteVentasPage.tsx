import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useReporteVentas } from '../hooks/useReporteVentas'
import ResumenCards from '../components/ResumenCards'
import PorVarianteTable from '../components/PorVarianteTable'
import PorVendedorTable from '../components/PorVendedorTable'
import DetalleVentasTable from '../components/DetalleVentasTable'
import ReporteVentasFilters from '../components/ReporteVentasFilters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { downloadReporteVentasPdf } from '../services/reportes-service'
import { toast } from 'sonner'
import type { ReporteVentasFilters as Filters } from '../types/reportes'

export default function ReporteVentasPage() {
  const [filters, setFilters] = useState<Filters>({})
  const [pdfLoading, setPdfLoading] = useState(false)
  const { resumen, porVariante, porVendedor, detalleVentas, isLoading } = useReporteVentas(filters)

  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadReporteVentasPdf(filters)
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('Error al descargar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <PageTemplateSimple title="Reporte de Ventas" description="Análisis de ventas del sistema.">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <ReporteVentasFilters filters={filters} onChange={setFilters} />
          <Button onClick={handleExportPdf} disabled={pdfLoading} className="shrink-0 h-8">
            <FileDown />
            {pdfLoading ? 'Descargando...' : 'PDF'}
          </Button>
        </div>

        <ResumenCards resumen={resumen} isLoading={isLoading} />

        <Tabs defaultValue="variante">
          <TabsList>
            <TabsTrigger value="variante">Por variante</TabsTrigger>
            <TabsTrigger value="vendedor">Por vendedor</TabsTrigger>
            <TabsTrigger value="detalle">Detalle de ventas</TabsTrigger>
          </TabsList>

          <TabsContent value="variante" className="mt-4">
            <PorVarianteTable data={porVariante} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="vendedor" className="mt-4">
            <PorVendedorTable data={porVendedor} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="detalle" className="mt-4">
            <DetalleVentasTable data={detalleVentas} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </PageTemplateSimple>
  )
}

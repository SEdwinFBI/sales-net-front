import { useCallback, useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { useReporteCobros } from '../hooks/useReporteCobros'
import ReporteCobrosFilters from '../components/ReporteCobrosFilters'
import CobrosPorSucursal from '../components/CobrosPorSucursal'
import { downloadReporteCobrosPdf } from '../services/reportes-service'
import type { ReporteCobrosFilters as Filters } from '../types/reportes'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildCobrosTools } from '../agent/reportes-tools'

export default function ReporteCobrosPage() {
  const [filters, setFilters] = useState<Filters>({})
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfUserLoading, setPdfUserLoading] = useState<number | null>(null)
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')
  const activeFilters = hasFilters ? filters : undefined
  const { porSucursal, isLoading } = useReporteCobros(activeFilters)

  const handleExportPdf = async (): Promise<boolean> => {
    setPdfLoading(true)
    try {
      await downloadReporteCobrosPdf(activeFilters)
      toast.success('PDF descargado correctamente')
      return true
    } catch {
      toast.error('Error al descargar el PDF')
      return false
    } finally {
      setPdfLoading(false)
    }
  }

  const downloadUserPdf = useCallback(async (userFilters: Filters): Promise<boolean> => {
    if (!userFilters.id_usuario) return false
    setPdfUserLoading(userFilters.id_usuario)
    try {
      await downloadReporteCobrosPdf(userFilters)
      toast.success('PDF descargado correctamente')
      return true
    } catch {
      toast.error('Error al descargar el PDF')
      return false
    } finally {
      setPdfUserLoading(null)
    }
  }, [])

  const handleExportUserPdf = useCallback((userFilters: Filters) => {
    void downloadUserPdf(userFilters)
  }, [downloadUserPdf])

  // Tools del agente: los filtros son estado local de esta pantalla (la fecha puntual es opcional, como en la UI).
  useAgentTools(
    'reporte-cobros-page',
    buildCobrosTools({
      getFilters: () => ({ nombre: filters.nombre, fecha: filters.fecha }),
      setFilters: ({ nombre, fecha }) => setFilters({ nombre: nombre || undefined, fecha: fecha || undefined }),
      getPorSucursal: () => porSucursal,
      isLoading: () => isLoading,
      isDownloading: () => pdfLoading || pdfUserLoading !== null,
      download: handleExportPdf,
      downloadUser: (usuarioId, sucursalId) =>
        downloadUserPdf({ id_usuario: usuarioId, fecha: filters.fecha, id_sucursal: sucursalId ?? 'sin_sucursal' }),
    }),
  )

  return (
    <PageTemplateSimple title="Reporte de Cobros" description="Abonos por sucursal y usuario.">
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-center gap-4">
            <ReporteCobrosFilters filters={filters} onChange={setFilters} />
          </div>

          <div>
            <div className="mb-4 flex justify-start">
              <Button onClick={handleExportPdf} disabled={pdfLoading} className="h-9 w-full shrink-0 sm:w-auto">
                <FileDown />
                {pdfLoading ? 'Descargando...' : 'Descargar reporte'}
              </Button>
            </div>
            <CobrosPorSucursal
              data={porSucursal}
              isLoading={isLoading}
              onDownloadUserPdf={handleExportUserPdf}
              pdfUserLoading={pdfUserLoading}
              fecha={filters.fecha}
            />
          </div>
        </div>
      </Card>
    </PageTemplateSimple>
  )
}

import { useCallback, useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { useReporteCobros } from '../hooks/useReporteCobros'
import ReporteCobrosFilters from '../components/ReporteCobrosFilters'
import CobrosPorUsuarioTable from '../components/CobrosPorUsuarioTable'
import { downloadReporteCobrosPdf } from '../services/reportes-service'
import type { ReporteCobrosFilters as Filters } from '../types/reportes'

export default function ReporteCobrosPage() {
  const [filters, setFilters] = useState<Filters>({})
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfUserLoading, setPdfUserLoading] = useState<number | null>(null)
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')
  const activeFilters = hasFilters ? filters : undefined
  const { porUsuario, isLoading } = useReporteCobros(activeFilters)

  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadReporteCobrosPdf(activeFilters)
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('Error al descargar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportUserPdf = useCallback(async (userFilters: Filters) => {
    if (!userFilters.id_usuario) return
    setPdfUserLoading(userFilters.id_usuario)
    try {
      await downloadReporteCobrosPdf(userFilters)
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('Error al descargar el PDF')
    } finally {
      setPdfUserLoading(null)
    }
  }, [])

  return (
    <PageTemplateSimple title="Reporte de Cobros" description="Abonos realizados por usuario.">
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
            <CobrosPorUsuarioTable
              data={porUsuario}
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

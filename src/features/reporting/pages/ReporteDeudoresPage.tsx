import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useReporteDeudores } from '../hooks/useReporteDeudores'
import DeudoresResumenCards from '../components/DeudoresResumenCards'
import DeudoresTable from '../components/DeudoresTable'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { downloadReporteDeudoresPdf } from '../services/reportes-service'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'

export default function ReporteDeudoresPage() {
  const { clientes, resumen, isLoading } = useReporteDeudores()
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadReporteDeudoresPdf()
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('Error al descargar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <PageTemplateSimple title="Reporte de Deudores" description="Clientes con saldo pendiente.">

      <Card className='px-5'>

        <div className="flex items-center justify-between">
          <div />
          <Button onClick={handleExportPdf} disabled={pdfLoading}>
            <FileDown />
            {pdfLoading ? 'Descargando...' : 'Descargar Reporte'}
          </Button>
        </div>
        <DeudoresResumenCards resumen={resumen} isLoading={isLoading} />
        <DeudoresTable data={clientes} isLoading={isLoading} />
      </Card>

    </PageTemplateSimple >
  )
}

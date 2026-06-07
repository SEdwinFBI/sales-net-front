import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useReporteVentas } from '../hooks/useReporteVentas'
import ResumenCards from '../components/ResumenCards'
import PorVarianteTable from '../components/PorVarianteTable'
import PorVendedorTable from '../components/PorVendedorTable'
import ReporteVentasFilters from '../components/ReporteVentasFilters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { downloadReporteVentasPdf } from '../services/reportes-service'
import { toast } from 'sonner'
import { getDefaultDateRange } from '@/lib/dates'
import type { ReporteVentasFilters as Filters } from '../types/reportes'
import { Card } from '@/components/ui/card'

type Option = { id?: number; label: string }

function uniqueOptions<T>(items: T[], labelFn: (item: T) => string, idFn?: (item: T) => number): Option[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const l = labelFn(item)
    if (seen.has(l)) return false
    seen.add(l)
    return true
  }).map((item) => {
    const opt: Option = { label: labelFn(item) }
    if (idFn) opt.id = idFn(item)
    return opt
  })
}

function useGrowingOptions(compute: () => Option[], deps: unknown[]): Option[] {
  const [options, setOptions] = useState<Option[]>([])
  const labelsRef = useRef(new Set<string>())
  useEffect(() => {
    const fresh = compute()
    const freshLabels = new Set(fresh.map((o) => o.label))
    const prevLabels = labelsRef.current
    const hasNew = freshLabels.size > prevLabels.size || ![...freshLabels].every((l) => prevLabels.has(l))
    if (hasNew) {
      labelsRef.current = new Set([...prevLabels, ...freshLabels])
      setOptions((prev) => {
        const prevMap = new Map(prev.map((o) => [o.label, o]))
        for (const f of fresh) {
          if (!prevMap.has(f.label)) prevMap.set(f.label, f)
        }
        return [...prevMap.values()]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return options
}

function buildSearchParams(next: Filters): Record<string, string> {
  const p: Record<string, string> = {}
  if (next.fecha_desde) p.fecha_desde = next.fecha_desde
  if (next.fecha_hasta) p.fecha_hasta = next.fecha_hasta
  return p
}

export default function ReporteVentasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [idArticulo, setIdArticulo] = useState<number | undefined>()
  const [idTalla, setIdTalla] = useState<number | undefined>()
  const [idVendedor, setIdVendedor] = useState<number | undefined>()

  const filters = useMemo<Filters>(() => {
    const d = getDefaultDateRange()
    return {
      fecha_desde: searchParams.get('fecha_desde') || d.fecha_desde,
      fecha_hasta: searchParams.get('fecha_hasta') || d.fecha_hasta,
      id_vendedor: idVendedor,
      id_articulo: idArticulo,
      id_talla: idTalla,
    }
  }, [searchParams, idArticulo, idTalla, idVendedor])

  const { resumen, porVariante, porVendedor, isLoading } = useReporteVentas(filters)

  const articuloOptions = useGrowingOptions(
    () => uniqueOptions(porVariante, (v) => v.articulo, (v) => v.id_articulo),
    [porVariante],
  )

  const tallaOptions = useGrowingOptions(
    () => uniqueOptions(porVariante, (v) => v.talla, (v) => v.id_talla),
    [porVariante],
  )

  const vendedorOptions = useGrowingOptions(
    () => uniqueOptions(porVendedor, (v) => v.nombre, (v) => v.id_vendedor),
    [porVendedor],
  )

  const handleFiltersChange = (next: Filters) => {
    setSearchParams(buildSearchParams(next), { replace: true })
    setIdArticulo(next.id_articulo)
    setIdTalla(next.id_talla)
    setIdVendedor(next.id_vendedor)
  }

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
      <Card className="mx-auto px-5">
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <ReporteVentasFilters
              filters={filters}
              onChange={handleFiltersChange}
              articuloOptions={articuloOptions}
              tallaOptions={tallaOptions}
              vendedorOptions={vendedorOptions}
            />

          </div>

          <ResumenCards resumen={resumen} isLoading={isLoading} />
          <div>


            <Tabs defaultValue="variante">
              <TabsList>
                <TabsTrigger value="variante">Variantes</TabsTrigger>
                <TabsTrigger value="vendedor">Vendedores</TabsTrigger>
                <Button onClick={handleExportPdf} disabled={pdfLoading} className="shrink-0 h-8">
                  <FileDown />
                  {pdfLoading ? 'Descargando...' : 'Descargar reporte'}
                </Button>
              </TabsList>

              <TabsContent value="variante" className="mt-4">
                <PorVarianteTable data={porVariante} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="vendedor" className="mt-4">
                <PorVendedorTable data={porVendedor} isLoading={isLoading} />
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </Card>
    </PageTemplateSimple>
  )
}

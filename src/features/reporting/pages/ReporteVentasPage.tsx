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
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildReporteVentasTools } from '../agent/reportes-tools'

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
  const [activeTab, setActiveTab] = useState('variante')
  const [idArticulo, setIdArticulo] = useState<number | undefined>()
  const [idTalla, setIdTalla] = useState<number | undefined>()
  const [idSucursal, setIdSucursal] = useState<number | undefined>()

  const filters = useMemo<Filters>(() => {
    const d = getDefaultDateRange()
    return {
      fecha_desde: searchParams.get('fecha_desde') || d.fecha_desde,
      fecha_hasta: searchParams.get('fecha_hasta') || d.fecha_hasta,
      id_sucursal: idSucursal,
      id_articulo: idArticulo,
      id_talla: idTalla,
    }
  }, [searchParams, idArticulo, idTalla, idSucursal])

  const { resumen, porVariante, porSucursal, isLoading } = useReporteVentas(filters)

  const articuloOptions = useGrowingOptions(
    () => uniqueOptions(porVariante, (v) => v.articulo, (v) => v.id_articulo),
    [porVariante],
  )

  const tallaOptions = useGrowingOptions(
    () => uniqueOptions(porVariante, (v) => v.talla, (v) => v.id_talla),
    [porVariante],
  )

  const sucursalOptions = useGrowingOptions(
    () => uniqueOptions(porSucursal, (v) => v.nombre, (v) => v.id_sucursal),
    [porSucursal],
  )

  const handleFiltersChange = (next: Filters) => {
    setSearchParams(buildSearchParams(next), { replace: true })
    setIdArticulo(next.id_articulo)
    setIdTalla(next.id_talla)
    setIdSucursal(next.id_sucursal)
  }

  const handleExportPdf = async (): Promise<boolean> => {
    setPdfLoading(true)
    try {
      await downloadReporteVentasPdf(filters)
      toast.success('PDF descargado correctamente')
      return true
    } catch {
      toast.error('Error al descargar el PDF')
      return false
    } finally {
      setPdfLoading(false)
    }
  }

  // Tools del agente: fechas en la URL y artículo/talla/sucursal en estado local, igual que el formulario de filtros.
  useAgentTools(
    'reporte-ventas-page',
    buildReporteVentasTools({
      getFilters: () => ({
        fecha_desde: filters.fecha_desde ?? '',
        fecha_hasta: filters.fecha_hasta ?? '',
        id_sucursal: filters.id_sucursal,
        id_articulo: filters.id_articulo,
        id_talla: filters.id_talla,
      }),
      change: (next) => handleFiltersChange(next),
      getOptions: () => ({ articulos: articuloOptions, tallas: tallaOptions, sucursales: sucursalOptions }),
      getTab: () => (activeTab === 'sucursal' ? 'sucursal' : 'variante'),
      setTab: setActiveTab,
      getResumen: () => resumen,
      getPorVariante: () => porVariante,
      getPorSucursal: () => porSucursal,
      isLoading: () => isLoading,
      isDownloading: () => pdfLoading,
      download: handleExportPdf,
    }),
  )

  return (
    <PageTemplateSimple title="Reporte de Ventas" description="Análisis de ventas del sistema.">
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-center gap-4">
            <ReporteVentasFilters
              filters={filters}
              onChange={handleFiltersChange}
              articuloOptions={articuloOptions}
              tallaOptions={tallaOptions}
              sucursalOptions={sucursalOptions}
            />

          </div>

          <ResumenCards resumen={resumen} isLoading={isLoading} />
          <div>


            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
                <TabsTrigger value="variante">Variantes</TabsTrigger>
                <TabsTrigger value="sucursal">Sucursales</TabsTrigger>
                <Button onClick={handleExportPdf} disabled={pdfLoading} className="h-9 w-full shrink-0 sm:w-auto">
                  <FileDown />
                  {pdfLoading ? 'Descargando...' : 'Descargar reporte'}
                </Button>
              </TabsList>

              <TabsContent value="variante" className="mt-4">
                <PorVarianteTable data={porVariante} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="sucursal" className="mt-4">
                <PorVendedorTable data={porSucursal} isLoading={isLoading} />
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </Card>
    </PageTemplateSimple>
  )
}

import { useState } from 'react'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import Paginator from '@/components/shared/table/Paginator'
import { Card } from '@/components/ui/card'
import { getToday, getTodayRange } from '@/lib/dates'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useSucursales, useUsuarios } from '@/features/admin'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildMovimientosTools } from '../agent/movimientos-tools'
import { TIPOS_STOCK } from '../utils/tipos-movimiento'
import BotonDescargarPdf from '../components/BotonDescargarPdf'
import MovimientosFilters from '../components/MovimientosFilters'
import MovimientosTable from '../components/MovimientosTable'
import { useMovimientos } from '../hooks/useMovimientosStock'
import { downloadMovimientosPdf } from '../services/inventario-service'
import type { MovimientosFilters as Filters } from '../types/inventario'
import { paginationTool } from '@/features/agent/pagination-tools'

/**
 * Movimientos de EXISTENCIAS. Los movimientos de saldo del cliente (crédito,
 * abonos, ajustes) son otra cosa y viven en la ficha del cliente; lo único
 * que los relaciona con estos es el `id_venta` que ambos guardan.
 */
export default function MovimientosStockPage() {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    modulo: 'STOCK',
    ...getTodayRange(),
  })

  const { movimientos, pagination, isLoading } = useMovimientos(filters)

  // Paginación para el agente (la página se pide al servidor).
  useAgentTools('paginacion-movimientos', [
    paginationTool('movimientos', 'los movimientos de inventario', {
      get: () => ({
        pagina: pagination?.page ?? 1,
        paginas: pagination?.total_pages ?? 1,
        tamano: pagination?.page_size ?? movimientos.length,
        total: pagination?.total ?? movimientos.length,
      }),
      setPagina: (page) => setFilters((previo) => ({ ...previo, page })),
    }),
  ])
  const { data: sucursales } = useSucursales()
  const { data: usuarios } = useUsuarios()

  // Tools del agente: filtran, leen y descargan el PDF con lo que esta pantalla ya muestra.
  const [pdfBusy, setPdfBusy] = useState(false)
  useAgentTools(
    'movimientos-page',
    buildMovimientosTools({
      getFilters: () => filters,
      setFilters,
      resetFilters: () =>
        setFilters((previo) => ({ ...previo, page: 1, tipo: undefined, id_sucursal: undefined, id_usuario: undefined, ...getTodayRange() })),
      getOptions: () => ({
        tipos: TIPOS_STOCK,
        sucursales: sucursales.map((s) => ({ id: s.id, nombre: s.nombre })),
        usuarios: usuarios.map((u) => ({ id: u.id, nombre: u.fullName || u.username })),
      }),
      getMovimientos: () => movimientos,
      getPagination: () => pagination,
      isLoading: () => isLoading,
      isDownloading: () => pdfBusy,
      download: async () => {
        setPdfBusy(true)
        try {
          await downloadMovimientosPdf(filters)
          toast.success('PDF descargado correctamente')
          return true
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Error al descargar el PDF'))
          return false
        } finally {
          setPdfBusy(false)
        }
      },
      today: getToday,
    }),
  )

  return (
    <PageTemplateSimple
      title="Movimientos de stock"
      description="Todo lo que entra y sale de las existencias, con lo que había y lo que quedó."
    >
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <MovimientosFilters filters={filters} onChange={setFilters} />

          <div className="flex justify-start">
            <BotonDescargarPdf
              onDownload={() => downloadMovimientosPdf(filters)}
              disabled={isLoading}
            />
          </div>

          <MovimientosTable movimientos={movimientos} isLoading={isLoading} />

          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center">
              <Paginator
                page={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={(page) => setFilters((previo) => ({ ...previo, page }))}
              />
            </div>
          )}
        </div>
      </Card>
    </PageTemplateSimple>
  )
}

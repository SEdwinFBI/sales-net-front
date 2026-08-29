import { useState } from 'react'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import Paginator from '@/components/shared/table/Paginator'
import { Card } from '@/components/ui/card'
import { getTodayRange } from '@/lib/dates'
import BotonDescargarPdf from '../components/BotonDescargarPdf'
import MovimientosFilters from '../components/MovimientosFilters'
import MovimientosTable from '../components/MovimientosTable'
import { useMovimientos } from '../hooks/useMovimientosStock'
import { downloadMovimientosPdf } from '../services/inventario-service'
import type { MovimientosFilters as Filters } from '../types/inventario'

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

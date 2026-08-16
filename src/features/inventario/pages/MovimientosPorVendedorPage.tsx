import { useMemo, useState } from 'react'
import { PackagePlus, ShoppingCart, Users } from 'lucide-react'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import Paginator from '@/components/shared/table/Paginator'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { formatNumber } from '@/helpers/money'
import { useUsuarios } from '@/features/adminUsuarios/hooks/useUsuarios'
import { getTodayRange } from '@/lib/dates'
import BotonDescargarPdf from '../components/BotonDescargarPdf'
import MovimientosFilters from '../components/MovimientosFilters'
import MovimientosTable from '../components/MovimientosTable'
import { useMovimientos } from '../hooks/useMovimientosStock'
import { downloadMovimientosPdf } from '../services/inventario-service'
import type { Movimiento, MovimientosFilters as Filters } from '../types/inventario'

type ResumenVendedor = {
  id: number | null
  nombre: string
  movimientos: Movimiento[]
  entradas: number
  salidas: number
}

/** Agrupa la página actual por vendedor y suma sus entradas y salidas. */
function agruparPorVendedor(movimientos: Movimiento[]): ResumenVendedor[] {
  const grupos = new Map<number | null, ResumenVendedor>()

  movimientos.forEach((movimiento) => {
    const id = movimiento.usuario_afectado?.id ?? null
    const nombre = movimiento.usuario_afectado?.full_name
      || movimiento.usuario_afectado?.username
      || 'Sin vendedor'

    const grupo = grupos.get(id) ?? { id, nombre, movimientos: [], entradas: 0, salidas: 0 }
    grupo.movimientos.push(movimiento)

    movimiento.detalles.forEach((detalle) => {
      if (detalle.cantidad > 0) grupo.entradas += detalle.cantidad
      else grupo.salidas += -detalle.cantidad
    })

    grupos.set(id, grupo)
  })

  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

/**
 * Movimientos agrupados por vendedor: cuánto resurtió y cuánto descargó cada
 * uno. La agrupación es sobre la página traída del servidor, por eso el
 * selector de vendedor filtra en el backend y no en el cliente.
 */
export default function MovimientosPorVendedorPage() {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 50,
    modulo: 'STOCK',
    ...getTodayRange(),
  })
  const { movimientos, pagination, isLoading } = useMovimientos(filters)
  const { data: usuarios } = useUsuarios()

  const grupos = useMemo(() => agruparPorVendedor(movimientos), [movimientos])

  return (
    <PageTemplateSimple
      title="Movimientos por vendedor"
      description="Disminuciones y resurtidos de existencias de cada vendedor."
    >
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <MovimientosFilters filters={filters} onChange={setFilters} />
            <div className="min-w-0 px-3 pb-3 sm:px-4 sm:pb-4">
              <label className="mb-1 block text-xs text-muted-foreground">Vendedor</label>
              <Select
                value={String(filters.id_usuario ?? '')}
                onChange={(e) =>
                  setFilters((previo) => ({
                    ...previo,
                    page: 1,
                    id_usuario: e.target.value || undefined,
                  }))
                }
                className="w-full sm:w-56"
              >
                <option value="">Todos los vendedores</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.fullName || usuario.username}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-start">
            <BotonDescargarPdf
              onDownload={() => downloadMovimientosPdf(filters, true)}
              disabled={isLoading}
            />
          </div>

          {!isLoading && grupos.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin movimientos"
              description="Ningún vendedor tiene movimientos con los filtros seleccionados."
            />
          ) : (
            grupos.map((grupo) => (
              <section key={grupo.id ?? 'sin-vendedor'} className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-2">
                  <h2 className="text-sm font-semibold">{grupo.nombre}</h2>
                  <span className="flex items-center gap-1 text-xs text-successful">
                    <PackagePlus className="size-3.5" />
                    Resurtido: {formatNumber(grupo.entradas)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <ShoppingCart className="size-3.5" />
                    Disminución: {formatNumber(grupo.salidas)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {grupo.movimientos.length} movimiento{grupo.movimientos.length === 1 ? '' : 's'}
                  </span>
                </div>
                <MovimientosTable
                  movimientos={grupo.movimientos}
                  isLoading={false}
                  ocultarVendedor
                />
              </section>
            ))
          )}

          {isLoading && <MovimientosTable movimientos={[]} isLoading />}

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

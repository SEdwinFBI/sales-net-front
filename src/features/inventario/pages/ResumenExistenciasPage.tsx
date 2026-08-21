import { useState } from 'react'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSucursales } from '@/features/adminSucursales/hooks/useSucursales'
import { useCustomers } from '@/features/usuarios/hooks/useCustomers'
import { getToday, getTodayRange } from '@/lib/dates'
import BotonDescargarPdf from '../components/BotonDescargarPdf'
import ResumenExistenciasTable from '../components/ResumenExistenciasTable'
import { useResumenExistencias } from '../hooks/useResumenExistencias'
import { downloadResumenPdf } from '../services/inventario-service'
import type { ResumenFilters } from '../types/inventario'

/**
 * Resumen de existencias por variante: lo que había, lo que hay y lo que se
 * vendió en el rango. Los tres números salen del ledger, así que siempre
 * cuadra había + entradas − salidas = hay.
 */
export default function ResumenExistenciasPage() {
  const [filters, setFilters] = useState<ResumenFilters>(getTodayRange())
  const [incluirDetalle, setIncluirDetalle] = useState(false)

  const { resumen, totales, isLoading } = useResumenExistencias(filters)
  const { data: sucursales } = useSucursales()
  const { data: clientes } = useCustomers()

  const set = (key: keyof ResumenFilters, value: string | undefined) => {
    setFilters((previo) => ({ ...previo, [key]: value !== '' ? value : undefined }))
  }

  // Las fechas son obligatorias: vaciar el campo lo devuelve a hoy.
  const setFecha = (key: 'fecha_desde' | 'fecha_hasta', value: string) => {
    setFilters((previo) => ({ ...previo, [key]: value || getToday() }))
  }

  return (
    <PageTemplateSimple
      title="Resumen de existencias"
      description="Lo que había, lo que hay y lo que se vendió de cada variante."
    >
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 items-end gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <label htmlFor="resumen-desde" className="mb-1 block text-xs text-muted-foreground">
                Desde <span className="text-destructive">*</span>
              </label>
              <Input
                id="resumen-desde"
                type="date"
                required
                max={filters.fecha_hasta ?? undefined}
                value={filters.fecha_desde ?? getToday()}
                onChange={(e) => setFecha('fecha_desde', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="resumen-hasta" className="mb-1 block text-xs text-muted-foreground">
                Hasta <span className="text-destructive">*</span>
              </label>
              <Input
                id="resumen-hasta"
                type="date"
                required
                min={filters.fecha_desde ?? undefined}
                value={filters.fecha_hasta ?? getToday()}
                onChange={(e) => setFecha('fecha_hasta', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Sucursal</label>
              <Select
                value={String(filters.id_sucursal ?? '')}
                onChange={(e) => set('id_sucursal', e.target.value)}
                className="w-full"
              >
                <option value="">Todas</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
              <Select
                value={String(filters.id_cliente ?? '')}
                onChange={(e) => set('id_cliente', e.target.value)}
                className="w-full"
              >
                <option value="">Todos</option>
                {(clientes ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <BotonDescargarPdf
              onDownload={() => downloadResumenPdf(filters, incluirDetalle)}
              disabled={isLoading}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={incluirDetalle} onCheckedChange={setIncluirDetalle} />
              Incluir el detalle de movimientos en el PDF
            </label>
          </div>

          <ResumenExistenciasTable
            data={resumen}
            totales={totales}
            isLoading={isLoading}
            filtradoPorCliente={Boolean(filters.id_cliente)}
          />
        </div>
      </Card>
    </PageTemplateSimple>
  )
}

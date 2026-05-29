import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useSalesHistory } from '../hooks/useSalesHistory'
import HistorialVentasTable from '../components/HistorialVentasTable'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RotateCcw, Search } from 'lucide-react'
import type { SalesHistoryFilters } from '../types/sales'

export default function HistorialVentasPage() {
  const [filters, setFilters] = useState<SalesHistoryFilters>({})
  const [formaPagoFilter, setFormaPagoFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const { ventas, isLoading } = useSalesHistory(filters)

  const hasFilters = Object.values(filters).some((v) => v !== undefined) || !!formaPagoFilter

  const filtered = ventas.filter((v) => {
    if (formaPagoFilter && v.forma_pago !== formaPagoFilter) return false
    if (!searchText) return true
    const q = searchText.toLowerCase()
    return (
      String(v.id).includes(q) ||
      v.cliente_info.nombre_completo.toLowerCase().includes(q) ||
      v.vendedor.full_name.toLowerCase().includes(q)
    )
  })

  const estados = [...new Set(ventas.map((v) => v.estado))]
  const formasPago = [...new Set(ventas.map((v) => v.forma_pago))]

  const clearFilters = () => {
    setFilters({})
    setFormaPagoFilter('')
    setSearchText('')
  }

  return (
    <PageTemplateSimple title="Historial de Ventas" description="Todas las ventas registradas en el sistema.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-gradient-to-b from-muted/10 to-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label>
            <Input
              type="date"
              value={filters.fecha_desde ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, fecha_desde: e.target.value || undefined }))}
              className="h-8 w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label>
            <Input
              type="date"
              value={filters.fecha_hasta ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, fecha_hasta: e.target.value || undefined }))}
              className="h-8 w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Estado</label>
            <Select
              value={filters.estado ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value || undefined }))}
              className="h-8 w-36"
            >
              <option value="">Todos</option>
              {estados.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Forma de pago</label>
            <Select
              value={formaPagoFilter}
              onChange={(e) => setFormaPagoFilter(e.target.value)}
              className="h-8 w-40"
            >
              <option value="">Todas</option>
              {formasPago.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ID, cliente, vendedor..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8 w-48 pl-8"
              />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
              <RotateCcw />
              Limpiar
            </Button>
          )}
        </div>

        <HistorialVentasTable data={filtered} isLoading={isLoading} />
      </div>
    </PageTemplateSimple>
  )
}

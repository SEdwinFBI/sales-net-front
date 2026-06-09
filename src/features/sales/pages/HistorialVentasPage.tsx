import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useSalesHistory } from '../hooks/useSalesHistory'
import HistorialVentasTable from '../components/HistorialVentasTable'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { getDefaultDateRange } from '@/lib/dates'
import type { SalesHistoryFilters } from '../types/sales'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/core/store/auth-store'

export default function HistorialVentasPage() {

  const user = useAuthStore(state => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, _setFilters] = useState<SalesHistoryFilters>(() => {
    const d = getDefaultDateRange()
    return {
      fecha_desde: searchParams.get('fecha_desde') || d.fecha_desde,
      fecha_hasta: searchParams.get('fecha_hasta') || d.fecha_hasta,
    }
  })
  const [formaPagoFilter, setFormaPagoFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const { ventas, isLoading } = useSalesHistory(filters, String(user?.id))
  const [estados, setEstados] = useState<string[]>([])
  const [formasPago, setFormasPago] = useState<string[]>([])



  useEffect(() => {
    const nuevosEstados = [...new Set(ventas.map(v => v.estado))]
    const nuevasFormasPago = [...new Set(ventas.map(v => v.forma_pago))]


    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstados((prev) => {
      if (nuevosEstados.length > prev.length) return nuevosEstados
      return prev
    })


    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormasPago((prev) => {
      if (nuevasFormasPago.length > prev.length) return nuevasFormasPago
      return prev
    })

  }, [ventas])


  const syncDateParams = (f: SalesHistoryFilters) => {
    setSearchParams((prev) => {
      if (f.fecha_desde) prev.set('fecha_desde', f.fecha_desde)
      else prev.delete('fecha_desde')
      if (f.fecha_hasta) prev.set('fecha_hasta', f.fecha_hasta)
      else prev.delete('fecha_hasta')
      return prev
    }, { replace: true })
  }

  const setFilters = (next: SalesHistoryFilters | ((prev: SalesHistoryFilters) => SalesHistoryFilters)) => {
    _setFilters((prev) => {
      const result = typeof next === 'function' ? next(prev) : next
      syncDateParams(result)
      return result
    })
  }

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




  const clearFilters = () => {
    _setFilters((prev) => {
      const { fecha_desde, fecha_hasta } = prev
      return { fecha_desde, fecha_hasta }
    })
    setFormaPagoFilter('')
    setSearchText('')
  }

  return (
    <PageTemplateSimple title="Historial de Ventas" description="Todas las ventas registradas en el sistema.">
      <div className="space-y-6">
        <Card className="px-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 items-center gap-3 justify-center  rounded-2xl shadow-sm p-4">
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label>
              <Input
                type="date"
                value={filters.fecha_desde ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, fecha_desde: e.target.value || undefined }))}
                className="h-8 w-full"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label>
              <Input
                type="date"
                value={filters.fecha_hasta ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, fecha_hasta: e.target.value || undefined }))}
                className="h-8 w-full"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Estado</label>
              <Select
                value={filters.estado ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value || undefined }))}
                className="h-8 w-full"
              >
                <option value="">Todos</option>
                {estados.map((e) => <option key={e} value={e}>{e}</option>)}
              </Select>
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-muted-foreground">Forma de pago</label>
              <Select
                value={formaPagoFilter}
                onChange={(e) => setFormaPagoFilter(e.target.value)}
                className="h-8 w-full"
              >
                <option value="">Todas</option>
                {formasPago.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </div>

            {hasFilters && (
              <div className="min-w-0 self-end">
                <Button variant="secondary" size="sm" onClick={clearFilters} className="h-8 w-full">
                  <RotateCcw />
                </Button>
              </div>
            )}
          </div>

          <HistorialVentasTable data={filtered} isLoading={isLoading} />
        </Card>
      </div>
    </PageTemplateSimple>
  )
}

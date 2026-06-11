import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { getDefaultDateRange } from '@/lib/dates'
import SearchableSelect from './SearchableSelect'
import type { ReporteVentasFilters as Filters } from '../types/reportes'

type Option = { id?: number; label: string }

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
  articuloOptions: Option[]
  tallaOptions: Option[]
  vendedorOptions: Option[]
}

export default function ReporteVentasFilters({
  filters,
  onChange,
  articuloOptions,
  tallaOptions,
  vendedorOptions,
}: Props) {
  const set = (key: keyof Filters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value !== undefined && value !== '' ? value : undefined })
  }

  const clear = () => {
    const d = getDefaultDateRange()
    onChange({
      fecha_desde: d.fecha_desde,
      fecha_hasta: d.fecha_hasta,
      id_variante: undefined,
      id_vendedor: undefined,
      id_articulo: undefined,
      id_talla: undefined,
    })
  }

  const hasFilters = filters.id_variante !== undefined
    || filters.id_vendedor !== undefined
    || filters.id_articulo !== undefined
    || filters.id_talla !== undefined

  return (
    <div className="grid w-full grid-cols-1 items-end gap-3 rounded-xl border border-border/70 bg-primary-nav/35 p-3 min-[480px]:grid-cols-2 sm:p-4 md:grid-cols-3 lg:grid-cols-6">
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label>
        <Input
          type="date"
          value={filters.fecha_desde ?? ''}
          onChange={(e) => set('fecha_desde', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label>
        <Input
          type="date"
          value={filters.fecha_hasta ?? ''}
          onChange={(e) => set('fecha_hasta', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1  text-xs text-muted-foreground">Artículo</label>
        <SearchableSelect
          value={filters.id_articulo}
          onChange={(v) => set('id_articulo', v ? Number(v) : undefined)}
          options={articuloOptions}
          placeholder="Buscar artículo..."
          className="w-full"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1  text-xs text-muted-foreground">Talla</label>
        <SearchableSelect
          value={filters.id_talla}
          onChange={(v) => set('id_talla', v ? Number(v) : undefined)}
          options={tallaOptions}
          placeholder="Buscar talla..."
          className="w-full"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1  text-xs text-muted-foreground">Vendedor</label>
        <SearchableSelect
          value={filters.id_vendedor}
          onChange={(v) => set('id_vendedor', v ? Number(v) : undefined)}
          options={vendedorOptions}
          placeholder="Buscar vendedor..."
          className="w-full"
        />
      </div>
      {hasFilters && (
        <div className="min-w-0 self-end">
          <Button variant="secondary" size="sm" onClick={clear} className="h-9 w-full self-end">
            <RotateCcw />
          </Button>
        </div>
      )}
    </div>
  )
}

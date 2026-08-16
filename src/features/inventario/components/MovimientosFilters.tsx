import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getToday, getTodayRange } from '@/lib/dates'
import type { MovimientosFilters as Filters, TipoMovimiento } from '../types/inventario'
import { TIPOS_STOCK } from '../utils/tipos-movimiento'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
  /** Tipos que ofrece el desplegable; por defecto los de stock. */
  tipos?: { value: TipoMovimiento | ''; label: string }[]
}

export default function MovimientosFilters({ filters, onChange, tipos = TIPOS_STOCK }: Props) {
  // Cualquier cambio de filtro vuelve a la página 1: si no, se puede quedar
  // en una página que ya no existe con el filtro nuevo.
  const set = (key: keyof Filters, value: string | undefined) => {
    onChange({
      ...filters,
      page: 1,
      [key]: value !== undefined && value !== '' ? value : undefined,
    })
  }

  // Las fechas son obligatorias: si el usuario vacía el campo, vuelve a hoy
  // en lugar de quedar sin filtro.
  const setFecha = (key: 'fecha_desde' | 'fecha_hasta', value: string) => {
    onChange({ ...filters, page: 1, [key]: value || getToday() })
  }

  return (
    <div className="grid w-full grid-cols-1 items-end gap-3 rounded-xl p-3 min-[480px]:grid-cols-2 sm:p-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
      <div className="min-w-0">
        <label htmlFor="mov-desde" className="mb-1 block text-xs text-muted-foreground">
          Desde <span className="text-destructive">*</span>
        </label>
        <Input
          id="mov-desde"
          type="date"
          required
          max={filters.fecha_hasta ?? undefined}
          value={filters.fecha_desde ?? getToday()}
          onChange={(e) => setFecha('fecha_desde', e.target.value)}
          className="w-full"
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="mov-hasta" className="mb-1 block text-xs text-muted-foreground">
          Hasta <span className="text-destructive">*</span>
        </label>
        <Input
          id="mov-hasta"
          type="date"
          required
          min={filters.fecha_desde ?? undefined}
          value={filters.fecha_hasta ?? getToday()}
          onChange={(e) => setFecha('fecha_hasta', e.target.value)}
          className="w-full"
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="mov-tipo" className="mb-1 block text-xs text-muted-foreground">Tipo</label>
        <Select
          id="mov-tipo"
          value={filters.tipo ?? ''}
          onChange={(e) => set('tipo', e.target.value)}
          className="w-full"
        >
          {tipos.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
          ))}
        </Select>
      </div>

      {filters.tipo && (
        <div className="min-w-0 self-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange({ ...filters, page: 1, tipo: undefined, ...getTodayRange() })}
            className="h-9 w-full"
            aria-label="Limpiar filtros"
          >
            <RotateCcw />
          </Button>
        </div>
      )}
    </div>
  )
}

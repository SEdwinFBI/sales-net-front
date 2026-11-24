import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw, Search } from 'lucide-react'
import type { ReporteCobrosFilters as Filters } from '../types/reportes'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function ReporteCobrosFilters({ filters, onChange }: Props) {
  const setNombre = (value: string) => {
    onChange({ ...filters, nombre: value !== '' ? value : undefined })
  }

  const setFechaRango = (key: 'fecha_desde' | 'fecha_hasta', value: string) => {
    // Al usar rango en la UI se limpia `fecha` puntual para evitar que el backend combine ambos.
    onChange({ ...filters, fecha: undefined, [key]: value !== '' ? value : undefined })
  }

  const hasFilters = Boolean(filters.nombre || filters.fecha || filters.fecha_desde || filters.fecha_hasta)

  return (
    <div className="grid w-full grid-cols-1 items-end gap-3 rounded-2xl border border-border/75 bg-muted/35 p-3 min-[480px]:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))_auto]">
      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Vendedor</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.nombre ?? ''}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Vendedor que cobró..."
            className="w-full pl-9"
          />
        </div>
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha desde</label>
        <Input
          type="date"
          aria-label="Fecha desde"
          value={filters.fecha_desde ?? filters.fecha ?? ''}
          onChange={(e) => setFechaRango('fecha_desde', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha hasta</label>
        <Input
          type="date"
          aria-label="Fecha hasta"
          value={filters.fecha_hasta ?? filters.fecha ?? ''}
          onChange={(e) => setFechaRango('fecha_hasta', e.target.value)}
          className="w-full"
        />
      </div>
      {hasFilters && (
        <div className="min-w-0 self-end">
          <Button variant="outline" size="sm" onClick={() => onChange({})} className="h-9 w-full self-end">
            <RotateCcw className="size-3.5" />
            Limpiar
          </Button>
        </div>
      )}
    </div>
  )
}

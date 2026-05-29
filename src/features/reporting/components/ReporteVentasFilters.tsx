import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import type { ReporteVentasFilters as Filters } from '../types/reportes'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function ReporteVentasFilters({ filters, onChange }: Props) {
  const set = (key: keyof Filters, value: string | undefined) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  const clear = () => onChange({})

  const hasFilters = Object.values(filters).some((v) => v !== undefined)

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-gradient-to-b from-muted/10 to-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label>
        <Input
          type="date"
          value={filters.fecha_desde ?? ''}
          onChange={(e) => set('fecha_desde', e.target.value)}
          className="h-8 w-40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label>
        <Input
          type="date"
          value={filters.fecha_hasta ?? ''}
          onChange={(e) => set('fecha_hasta', e.target.value)}
          className="h-8 w-40"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-8">
          <RotateCcw />
          Limpiar
        </Button>
      )}
    </div>
  )
}

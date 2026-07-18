import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RotateCcw, Search } from 'lucide-react'
import type { ReporteCobrosFilters as Filters } from '../types/reportes'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function ReporteCobrosFilters({ filters, onChange }: Props) {
  const set = (key: keyof Filters, value: string | undefined) => {
    onChange({ ...filters, [key]: value !== undefined && value !== '' ? value : undefined })
  }

  const hasFilters = Boolean(filters.nombre || filters.fecha)

  return (
    <div className="grid w-full grid-cols-1 items-end gap-3 rounded-xl p-3 min-[480px]:grid-cols-2 sm:p-4 lg:grid-cols-[repeat(2,minmax(0,1fr))_auto] shadow-sm">
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Nombre</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.nombre ?? ''}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Nombre del usuario..."
            className="w-full pl-9"
          />
        </div>
      </div>
      <div className="min-w-0">
        <label className="mb-1 block text-xs text-muted-foreground">Fecha</label>
        <Input
          type="date"
          value={filters.fecha ?? ''}
          onChange={(e) => set('fecha', e.target.value)}
          className="w-full"
        />
      </div>
      {hasFilters && (
        <div className="min-w-0 self-end">
          <Button variant="secondary" size="sm" onClick={() => onChange({})} className="h-9 w-full self-end">
            <RotateCcw />
          </Button>
        </div>
      )}
    </div>
  )
}

import { Select } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const items = DIAS.map((label, index) => ({ label, value: index + 1 }))

interface Props {
  value: number[]
  onChange: (value: number[]) => void
  disabled?: boolean
}

export default function DiasCobrosSelect({ value, onChange, disabled }: Props) {
  const resumen = value.length === 7 ? 'Todos los días'
    : value.length ? value.map((dia) => DIAS[dia - 1].slice(0, 3)).join(', ') : 'Seleccionar días'

  return (
    <Select.Root multiple items={items} value={value} onValueChange={(values) => onChange([...values].sort((a, b) => a - b))} disabled={disabled}>
      <Select.Trigger id="dias-cobros" aria-labelledby="dias-cobros-label" className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50">
        <Select.Value className="truncate">{resumen}</Select.Value>
        <Select.Icon><ChevronDown className="size-4 shrink-0 text-muted-foreground" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} align="start" alignItemWithTrigger={false} className="z-50">
          <Select.Popup className="w-[var(--anchor-width)] min-w-48 overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-lg">
            <Select.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {items.map(({ label, value }) => (
                <Select.Item key={value} value={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-highlighted:bg-muted data-selected:font-medium">
                  <span className="flex size-4 items-center justify-center rounded border border-border">
                    <Select.ItemIndicator><Check className="size-3.5 text-primary" /></Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

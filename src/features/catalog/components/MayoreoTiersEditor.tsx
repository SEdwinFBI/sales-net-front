import { useEffect, useMemo, useState } from 'react'
import { Info, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { useMayoreoTiers } from '../hooks/useMayoreoTiers'
import { useSaveMayoreoTiers } from '../hooks/useSaveMayoreoTiers'
import type { MayoreoTier } from '../types/pricing-types'
import { mayoreoTiersSchema } from '../utils/pricing-schema'

/** Defaults del negocio: 2 unidades → 50% del individual, 3+ → 100%. */
const DEFAULT_TIER_ROWS: TierRow[] = [
  { min: '2', max: '2', sinLimite: false, modo: 'DERIVADO', factor: '50' },
  { min: '3', max: '', sinLimite: true, modo: 'DERIVADO', factor: '100' },
]

type TierRow = {
  min: string
  max: string
  sinLimite: boolean
  modo: 'DERIVADO' | 'MONTO_ARTICULO'
  factor: string
}

type Props = {
  seller: Usuario
  onGoToPrecios: () => void
}

function toRows(tiers: MayoreoTier[]): TierRow[] {
  return tiers.map((tier) => ({
    min: String(tier.unidades_min),
    max: tier.unidades_max !== null ? String(tier.unidades_max) : '',
    sinLimite: tier.unidades_max === null,
    modo: tier.usar_descuento_articulo ? 'MONTO_ARTICULO' : 'DERIVADO',
    factor: String(Number(tier.factor_individual) * 100),
  }))
}

const percentToFactor = (value: string) => value === '' ? '1' : String(Number(value) / 100)

export default function MayoreoTiersEditor({ seller, onGoToPrecios }: Props) {
  const { tiers, esDefault, isLoading } = useMayoreoTiers(seller.id)
  const { mutateAsync: saveTiers, isPending: isSaving } = useSaveMayoreoTiers()
  const [rows, setRows] = useState<TierRow[] | null>(null)

  useEffect(() => {
    // Carga inicial (y recarga tras guardar): refleja lo que hay en el server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isLoading) setRows(toRows(tiers))
  }, [tiers, isLoading])

  const currentRows = useMemo(() => rows ?? toRows(tiers), [rows, tiers])

  const isDirty = useMemo(
    () => JSON.stringify(currentRows) !== JSON.stringify(toRows(tiers)),
    [currentRows, tiers]
  )

  const setRow = (index: number, patch: Partial<TierRow>) => {
    setRows(currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    const last = currentRows[currentRows.length - 1]
    const nextMin = last ? String((Number(last.max || last.min) || 0) + 1) : '2'
    setRows([
      ...currentRows.map((row) => ({ ...row, sinLimite: false, max: row.sinLimite ? row.min : row.max })),
      { min: nextMin, max: '', sinLimite: true, modo: 'DERIVADO', factor: '100' },
    ])
  }

  const removeRow = (index: number) => {
    setRows(currentRows.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleRestoreDefaults = () => {
    setRows(DEFAULT_TIER_ROWS)
  }

  const handleSave = async () => {
    const parsedTiers: MayoreoTier[] = currentRows.map((row) => ({
      unidades_min: Number(row.min),
      unidades_max: row.sinLimite || row.max === '' ? null : Number(row.max),
      factor_individual: percentToFactor(row.factor),
      usar_descuento_articulo: row.modo === 'MONTO_ARTICULO',
    }))

    const validation = mayoreoTiersSchema.safeParse(
      parsedTiers.map((tier) => ({ ...tier, factor_individual: Number(tier.factor_individual) }))
    )
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? 'Revisa los rangos configurados')
      return
    }

    try {
      await saveTiers({ userId: seller.id, tiers: parsedTiers })
      toast.success('Configuración de mayoreo guardada')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar la configuración de mayoreo'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            Rangos para descuentos por mayoreo
            {esDefault && !isDirty && (
              <Badge className="ml-2" variant="outline">
                Default
              </Badge>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Descuento por mayoreo para cada talla
          </p>
        </div>
        <Button variant="outline" onClick={handleRestoreDefaults}>
          <RotateCcw />
          Restaurar defaults
        </Button>
      </div>

      <div className="space-y-3">
        {currentRows.map((row, index) => (
          <Card key={index} size="sm" className="bg-card p-4">
            <div className="grid gap-3 lg:grid-cols-[auto_5rem_5rem_auto_minmax(12rem,1fr)_5.5rem_2.5rem] lg:items-center">
              <span className="text-sm font-medium text-muted-foreground">De</span>
              <Input
                className="h-9 bg-card"
                inputMode="numeric"
                aria-label="Unidades mínimas"
                value={row.min}
                onChange={(event) => setRow(index, { min: event.target.value })}
              />
              <Input
                className="h-9 bg-card"
                inputMode="numeric"
                aria-label="Unidades máximas"
                placeholder="∞"
                disabled={row.sinLimite}
                value={row.sinLimite ? '' : row.max}
                onChange={(event) => setRow(index, { max: event.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={row.sinLimite}
                  onCheckedChange={(checked) => setRow(index, { sinLimite: checked })}
                />
                Sin límite
              </label>
              <Select
                aria-label="Modo del descuento mayorista"
                value={row.modo}
                onChange={(event) =>
                  setRow(index, { modo: event.target.value as TierRow['modo'] })
                }
              >
                <option value="DERIVADO">Derivado del descuento individual</option>
                <option value="MONTO_ARTICULO">Monto configurado en el artículo</option>
              </Select>
              {row.modo === 'DERIVADO' ? (
                <div className="relative">
                  <Input
                    className="h-9 bg-card pr-7"
                    inputMode="decimal"
                    aria-label="Factor sobre el descuento individual"
                    placeholder="50"
                    value={row.factor}
                    onChange={(event) => setRow(index, { factor: event.target.value })}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              ) : (
                <span />
              )}
              <div className="flex justify-end">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Eliminar rango"
                  disabled={currentRows.length === 1}
                  onClick={() => removeRow(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {row.modo === 'DERIVADO' ? (
                <span>
                  Calculo partir del descuento individual de
                  cada variante ({row.factor || '100'}%: individual Q30.00 a este rango Q
                  {(30 * (Number(row.factor || 100) / 100)).toFixed(2)}). Nunca se muestra porcentaje al vender.
                </span>
              ) : (
                <span>
                  Usa el monto "Desc. mayorista" configurado por variante en la pestaña{' '}
                  <button
                    type="button"
                    className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
                    onClick={onGoToPrecios}
                  >
                    Precios por artículo
                  </button>
                  .
                </span>
              )}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={addRow}>
          <Plus />
          Agregar rango
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}

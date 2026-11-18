import { useState, type FormEvent } from 'react'
import { CalendarDays, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDisplayDate } from '@/lib/dates'

import { CashSummary } from '../components/CashSummary'
import { MovementsTable } from '../components/MovementsTable'
import { useCreateMovimientoCaja, useMiCaja } from '../hooks/useCash'
import type { TipoMovimientoCaja } from '../types/cash'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool } from '@/features/agent/commit-tools'
import { buildMiCajaTools, buildMovimientoDialogTools } from '../agent/mi-caja-tools'

export default function MyCashPage() {
  const { data: caja, isLoading } = useMiCaja()
  const mutation = useCreateMovimientoCaja()
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('ENTRADA')
  const [monto, setMonto] = useState('')
  const [observacion, setObservacion] = useState('')

  const guardarMovimiento = async (): Promise<boolean> => {
    try {
      await mutation.mutateAsync({ tipo, monto: Number(monto), observacion })
      toast.success('Movimiento registrado correctamente')
      setTipo('ENTRADA')
      setMonto('')
      setObservacion('')
      setOpen(false)
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el movimiento'))
      return false
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void guardarMovimiento()
  }

  // Solo con las acciones de guardado activadas: el agente presiona «Guardar» tras un clic de confirmación.
  useAgentTools(
    'movimiento-dialog-guardar',
    open
      ? [
          commitTool({
            name: 'guardar_movimiento_caja',
            description: 'Guarda el movimiento de caja del formulario abierto (presiona Guardar).',
            validar: () => {
              if (mutation.isPending) return 'Ya se esta guardando.'
              return Number(monto) > 0 ? null : 'El monto debe ser mayor que cero.'
            },
            texto: () => `Registrar ${tipo === 'ENTRADA' ? 'una entrada' : 'un gasto'} de caja de Q${Number(monto).toFixed(2)}${observacion.trim() ? `: ${observacion.trim()}` : ''}`,
            run: guardarMovimiento,
          }),
        ]
      : null,
  )

  const movimientoValues = () => ({ tipo, monto: Number(monto), observacion })

  // Tools del agente: leen la caja y abren el formulario de movimiento (el usuario presiona Guardar).
  useAgentTools(
    'mi-caja-page',
    buildMiCajaTools({
      getCaja: () => caja,
      isLoading: () => isLoading,
      isDialogOpen: () => open,
      openMovimiento: (valores) => {
        // Abierto por el agente: parte de un formulario limpio más lo que pidió el usuario.
        setTipo(valores?.tipo ?? 'ENTRADA')
        setMonto(valores?.monto !== undefined ? String(valores.monto) : '')
        setObservacion(valores?.observacion ?? '')
        setOpen(true)
      },
    }),
  )
  useAgentTools(
    'movimiento-dialog',
    open
      ? buildMovimientoDialogTools({
          getValues: movimientoValues,
          setValues: (values) => {
            if (values.tipo !== undefined) setTipo(values.tipo)
            if (values.monto !== undefined) setMonto(String(values.monto))
            if (values.observacion !== undefined) setObservacion(values.observacion)
          },
        })
      : null,
  )

  return (
    <PageTemplateSimple title="Mi caja" description="Entradas y gastos de efectivo del día.">
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-primary-nav/35 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CalendarDays className="size-4" />
              </div>
              <div>
                <p className="font-medium">Caja de hoy</p>
                {caja ? (
                  <p className="text-xs text-muted-foreground">
                    {caja.sucursal.nombre} · {formatDisplayDate(caja.fecha)}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-3 w-44" />
                )}
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setOpen(true)} disabled={isLoading}>
              <Plus />
              Nuevo movimiento
            </Button>
          </div>

          {isLoading ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </>
          ) : caja ? (
            <>
              <CashSummary caja={caja} expectedLabel="Saldo esperado hoy" />
              <div className="space-y-3">
                <h2 className="font-heading text-base font-semibold">Movimientos</h2>
                <MovementsTable movimientos={caja.movimientos} />
              </div>
            </>
          ) : null}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>Entrada o gasto de la caja actual.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cash-type">Tipo</FieldLabel>
              <Select id="cash-type" value={tipo} onChange={(event) => setTipo(event.target.value as TipoMovimientoCaja)}>
                <option value="ENTRADA">Entrada de efectivo</option>
                <option value="SALIDA">Gasto / salida</option>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cash-amount">Monto</FieldLabel>
              <Input id="cash-amount" type="number" min="0.01" step="0.01" value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="0.00" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="cash-observation">Observación</FieldLabel>
              <Textarea id="cash-observation" value={observacion} onChange={(event) => setObservacion(event.target.value)} placeholder="Ej. efectivo inicial, almuerzo o pasaje" required />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                {mutation.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTemplateSimple>
  )
}

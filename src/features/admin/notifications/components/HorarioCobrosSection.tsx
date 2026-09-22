import { useState } from 'react'
import { BellRing, Clock, Loader2, Receipt, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api-error'
import { useHorarioCobros, useUpdateHorarioCobros } from '../hooks/useHorarioCobros'

export default function HorarioCobrosSection() {
  const { data, isPending, isError, error, refetch, isFetching } = useHorarioCobros()
  const update = useUpdateHorarioCobros()
  const [draft, setDraft] = useState<string | undefined>()
  const [saveError, setSaveError] = useState<string | null>(null)
  const hora = draft ?? data?.hora_notificacion ?? ''
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)

  const save = async (value: string | null) => {
    setSaveError(null)
    try {
      await update.mutateAsync(value)
      setDraft(undefined)
      toast.success(value === null ? 'Se usará el horario de la tarea' : 'Hora de notificación guardada')
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'No se pudo guardar el horario de cobros'))
    }
  }

  return (
    <section aria-labelledby="horario-cobros-title" className="space-y-4">
      <div className="flex items-center gap-2">
        <BellRing aria-hidden="true" className="size-5 text-primary" />
        <h2 id="horario-cobros-title" className="text-lg font-semibold">Alertas</h2>
      </div>

      {isPending ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando horario…
        </p>
      ) : isError ? (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            {getApiErrorMessage(error, 'No se pudo cargar el horario de cobros')}
          </p>
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-3">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (valid && !update.isPending) void save(hora)
            }}
          >
            <div className="grid items-center gap-5 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Receipt aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Cobros</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Avisos diarios de saldos pendientes.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label htmlFor="hora-notificacion-cobros" className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
                    Hora 
                  </span>
                </label>
                <Input
                  id="hora-notificacion-cobros"
                  type="time"
                  step={60}
                  required
                  value={hora}
                  disabled={update.isPending}
                  aria-describedby="horario-cobros-help"
                  onChange={(event) => {
                    setDraft(event.target.value)
                    setSaveError(null)
                  }}
                  className="h-11 w-full text-base"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&_button]:h-10">
              <Button type="submit" disabled={update.isPending || !valid || hora === data.hora_notificacion}>
                {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar hora
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={update.isPending || data.hora_notificacion === null}
                onClick={() => void save(null)}
              >
                Usar horario por defecto
              </Button>
            </div>
            {saveError && <p role="alert" className="w-full text-sm text-destructive">{saveError}</p>}
          </form>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-live="polite">
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="text-muted-foreground">Hora guardada:</dt>
              <dd className="font-medium">{data.hora_notificacion ?? 'Sin hora configurada'}</dd>
            </div>
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="text-muted-foreground">Zona horaria:</dt>
              <dd className="break-all font-medium">{data.zona_horaria}</dd>
            </div>
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="text-muted-foreground">Última fecha de envío:</dt>
              <dd className="font-medium">{data.ultima_fecha_envio ?? 'Sin envíos registrados'}</dd>
            </div>
          </dl>
          <p id="horario-cobros-help" className="text-sm leading-relaxed text-muted-foreground">
            Los cobros se notifican en la primera revisión a partir de la hora elegida.
            Sin hora configurada, se usa el horario por defecto y los avisos siguen activos.
          </p>
        </div>
      ) : null}
    </section>
  )
}

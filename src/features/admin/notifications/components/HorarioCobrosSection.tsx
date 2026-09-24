import { useState } from 'react'
import { BellRing, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DiasCobrosSelect from './DiasCobrosSelect'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-error'
import { useHorarioCobros, useUpdateHorarioCobros } from '../hooks/useHorarioCobros'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const TODOS = [1, 2, 3, 4, 5, 6, 7]
const LABORABLES = [1, 2, 3, 4, 5]

export default function HorarioCobrosSection() {
  const { data, isPending, isError, error, refetch, isFetching } = useHorarioCobros()
  const update = useUpdateHorarioCobros()
  const [draftHora, setDraftHora] = useState<string | null | undefined>()
  const [draftDias, setDraftDias] = useState<number[] | undefined>()
  const [lastDias, setLastDias] = useState<number[]>(TODOS)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hora = draftHora === undefined ? data?.hora_notificacion ?? null : draftHora
  const dias = draftDias ?? data?.dias_notificacion ?? []
  const activo = dias.length > 0
  const valid = hora === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
  const hasChanges = data !== undefined && (
    hora !== data.hora_notificacion || JSON.stringify(dias) !== JSON.stringify(data.dias_notificacion)
  )
  const diasResumen = dias.length === 7 ? 'Todos los días' : dias.map((dia) => DIAS[dia - 1]).join(', ')

  const changeDias = (values: number[]) => {
    if (values.length) setLastDias(values)
    setDraftDias(values)
    setSaveError(null)
  }

  
  const reset = () => {
    setDraftHora(undefined)
    setDraftDias(undefined)
    setSaveError(null)
  }

  const save = async () => {
    if (!hasChanges || !valid || update.isPending) return
    setSaveError(null)
    try {
      const saved = await update.mutateAsync({ dias_notificacion: dias, hora_notificacion: hora })
      reset()
      toast.success(saved.dias_notificacion.length ? 'Configuración de cobros guardada' : 'Avisos de cobros pausados')
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'No se pudo guardar la configuración de cobros'))
    }
  }

  return (
    <section aria-labelledby="horario-cobros-title" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing aria-hidden="true" className="size-4.5" />
          </div>
          <div>
            <h2 id="horario-cobros-title" className="text-lg font-semibold">Programación global de cobros</h2>
            <p className="text-sm text-muted-foreground">Los días desmarcados bloquean los avisos de todos los clientes.</p>
          </div>
        </div>
        {data && !isError && (
          <label className="flex cursor-pointer items-center gap-3 self-start rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium sm:self-auto">
            {activo ? 'Avisos activados' : 'Avisos pausados'}
            <Switch checked={activo} disabled={update.isPending} aria-label="Activar avisos de cobros" onCheckedChange={(checked) => {
              if (!checked) setLastDias(dias)
              changeDias(checked ? lastDias : [])
            }} />
          </label>
        )}
      </div>
      {isPending ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando configuración…
        </p>
      ) : isError ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">{getApiErrorMessage(error, 'No se pudo cargar la configuración de cobros')}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Reintentar</Button>
        </div>
      ) : data ? (
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save() }}>
          <div className="grid items-start gap-4 border-t border-border/70 pt-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="min-w-0 space-y-3">
              <label id="dias-cobros-label" htmlFor="dias-cobros" className="block text-sm font-medium">Días de envío</label>
              <DiasCobrosSelect value={dias} onChange={changeDias} disabled={update.isPending} />
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <button type="button" disabled={update.isPending} className="text-xs font-medium text-primary hover:underline disabled:opacity-50" onClick={() => changeDias(TODOS)}>Todos los días</button>
                <button type="button" disabled={update.isPending} className="text-xs font-medium text-primary hover:underline disabled:opacity-50" onClick={() => changeDias(LABORABLES)}>Lunes a viernes</button>
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              <label htmlFor="modo-horario-cobros" className="block text-sm font-medium">Horario</label>
              <Select
                id="modo-horario-cobros"
                value={hora === null ? 'default' : 'custom'}
                disabled={update.isPending}
                onChange={(event) => { setDraftHora(event.target.value === 'default' ? null : data.hora_notificacion ?? ''); setSaveError(null) }}
                className="h-11"
              >
                <option value="default">Usar horario por defecto</option>
                <option value="custom">Elegir una hora</option>
              </Select>
              <p className="text-xs text-muted-foreground">Hora local: {data.zona_horaria}.</p>
            </div>
            <div className="min-w-0 space-y-3">
              <label htmlFor="hora-notificacion-cobros" className="block text-sm font-medium">Hora de envío</label>
              <Input
                id="hora-notificacion-cobros" type="time" step={60}
                required={hora !== null} value={hora ?? ''}
                disabled={update.isPending || hora === null}
                aria-describedby="hora-cobros-ayuda"
                onChange={(event) => { setDraftHora(event.target.value); setSaveError(null) }}
                className="h-11 w-full text-base"
              />
              <p id="hora-cobros-ayuda" className="text-xs text-muted-foreground">
                {hora === null ? 'Horario predeterminado.' : !valid ? 'Selecciona una hora.' : 'Hora de inicio de los avisos.'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 border-l-2 border-primary/40 pl-3" role="status">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold">{hasChanges ? 'Nueva programación' : 'Programación actual'}</h4>
              {hasChanges && <Badge variant="secondary">Sin guardar</Badge>}
            </div>
            <p className="text-sm leading-relaxed">
              {!activo ? 'Avisos pausados. Selecciona al menos un día.'
                : `${diasResumen}. ${hora === null ? 'Horario predeterminado.' : valid ? `A partir de las ${hora}.` : 'Sin hora de envío.'}`}
            </p>
            <p className="text-xs text-muted-foreground">Solo se incluyen clientes activos con saldo pendiente que tengan marcado el mismo día. La hora de envío es aproximada.</p>
          </div>
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Último envío: <span className="font-medium text-foreground">{data.ultima_fecha_envio ?? 'Sin envíos registrados'}</span></p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {hasChanges && <Button type="button" variant="outline" disabled={update.isPending} onClick={reset}>Descartar cambios</Button>}
              <Button type="submit" disabled={update.isPending || !hasChanges || !valid}>
                {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {update.isPending ? 'Guardando…' : 'Guardar programación'}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  )
}

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Cliente } from '../types/clientes'

type Props = {
  cliente: Cliente
}

const initials = (name?: string) =>
  (name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

const parseDateOnly = (value?: string) => {
  if (!value) return null
  const [datePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const formatDateOnly = (value?: string) => {
  const date = parseDateOnly(value)
  if (!date) return value || 'Sin fecha'
  return date.toLocaleDateString()
}

export default function ClienteInfo({ cliente }: Props) {
  const notificationDate = parseDateOnly(cliente.fecha_notificacion)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isNotificationOverdue = notificationDate ? notificationDate < today : false

  return (
    <Card className="bg-white p-6">
      <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start">
        <div className={`flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${cliente.activo ? 'bg-emerald-500' : 'bg-stone-400'}`}>
          {initials(cliente.nombre_completo)}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">{cliente.nombre_completo}</h2>
            <Badge variant={cliente.activo ? 'default' : 'secondary'}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium">{cliente.telefono}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dirección</p>
              <p className="font-medium">{cliente.direccion}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-primary">Q{Number(cliente.balance).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Fecha de notificación</p>
              <div
                className={cn(
                  'mt-1 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
                  isNotificationOverdue
                    ? 'border-danger/30 bg-danger/10 text-danger'
                    : 'border-border bg-primary-nav/45 text-neutral'
                )}
              >
                <span>{formatDateOnly(cliente.fecha_notificacion)}</span>
                {isNotificationOverdue && (
                  <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-[0.68rem] uppercase tracking-wide">
                    Vencida
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de creación</p>
              <p className="font-medium">{new Date(cliente.fecha_creacion).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

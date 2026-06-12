import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Cliente } from '../types/clientes'

type Props = {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}

const initials = (name?: string) =>
  (name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

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

export default function ClienteCard({ cliente, onEdit, onDelete }: Props) {
  const notificationDate = parseDateOnly(cliente.fecha_notificacion)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isNotificationOverdue = notificationDate ? notificationDate < today : false

  return (
    <Card className={`relative overflow-hidden border-l-4 ${cliente.activo ? 'border-l-successful' : 'border-l-border'} bg-white p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${cliente.activo ? 'bg-successful' : 'bg-muted-foreground/70'}`}>
          {initials(cliente.nombre_completo)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="truncate font-semibold">{cliente.nombre_completo}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
            </div>
            {/* <Badge variant={cliente.activo ? 'default' : 'secondary'} className="shrink-0">
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </Badge> */}
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">Q{Number(cliente.balance).toFixed(2)}</span>
            <span className="text-xs text-primary">balance</span>
          </div>

          <div
            className={cn(
              'mt-2 inline-flex rounded-lg border px-2 py-1 text-xs font-medium',
              isNotificationOverdue
                ? 'border-danger/25 bg-danger/10 text-danger'
                : 'border-border bg-primary-nav/45 text-muted-foreground'
            )}
          >
            Notificacion: {formatDateOnly(cliente.fecha_notificacion)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <Link
          to={`${cliente.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <Eye className="size-3" />
          Ver detalle
        </Link>

        <div className="flex gap-1">
          <Button size="icon-xs" variant="ghost" onClick={onEdit} aria-label={`Editar ${cliente.nombre_completo}`}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={onDelete} className="text-danger hover:text-danger" aria-label={`Eliminar ${cliente.nombre_completo}`}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

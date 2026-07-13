import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Cliente } from '../types/clientes'
import { useAuthStore } from '@/features/core/store/auth-store'
import { initials } from '@/helpers/string'

type Props = {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}

export default function ClienteCard({ cliente, onEdit, onDelete }: Props) {
  const user = useAuthStore(s => s.user)
  const isNotAdmin = user?.role !== 'admin'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isNotificationPast = Boolean(cliente.fecha_notificacion && cliente.fecha_notificacion <= today)

  return (
    <Card className={`relative overflow-hidden border-l-4 ${cliente.activo ? 'border-l-successful' : 'border-l-border'} bg-card p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${cliente.activo ? 'bg-successful' : 'bg-muted-foreground/70'}`}>
          {initials(cliente.nombre_completo)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold truncate">{cliente.nombre_completo}</p>
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

          <p className={cn('mt-1 text-xs text-muted-foreground', isNotificationPast && 'text-danger')}>
            Notificación: {cliente.fecha_notificacion}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <Link
          to={`${cliente.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Eye className="size-3" />
          Ver detalle
        </Link>

        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={onEdit} disabled={isNotAdmin} aria-label={`Editar ${cliente.nombre_completo}`}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onDelete} disabled={isNotAdmin} className="text-danger hover:text-danger" aria-label={`Eliminar ${cliente.nombre_completo}`}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye } from 'lucide-react'
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

export default function ClienteCard({ cliente, onEdit, onDelete }: Props) {
  return (
    <Card className={`relative overflow-hidden border-l-4 ${cliente.activo ? 'border-l-emerald-500' : 'border-l-stone-300'} bg-white p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${cliente.activo ? 'bg-emerald-500' : 'bg-stone-400'}`}>
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

          <p className="mt-1 text-xs text-muted-foreground">
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
          <Button size="icon-xs" variant="ghost" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={onDelete} className="text-red-500 hover:text-red-600">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

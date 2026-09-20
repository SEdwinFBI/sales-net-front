import { Link } from 'react-router'
import { formatCurrency } from '../utils/venta-total'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, Tag } from 'lucide-react'
import type { Cliente } from '../types/clientes'
import { useAuthStore } from '@/features/core/store/auth-store'
import { initials } from '@/helpers/string'
import { mostrarDias } from '../utils/dias-notificacion'
import TipoClienteBadge from './TipoClienteBadge'

type Props = {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}

export default function ClienteCard({ cliente, onEdit, onDelete }: Props) {
  const user = useAuthStore(s => s.user)
  const isNotAdmin = user?.role !== 'admin'
  const soloPrecios = cliente.tipo_cliente === 'SOLO_PRECIOS'

  return (
    <Card className={`relative overflow-hidden border-l-4 ${!cliente.activo ? 'border-l-border' : soloPrecios ? 'border-l-violet-500' : 'border-l-emerald-500'} bg-card p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${!cliente.activo ? 'bg-muted-foreground/70' : soloPrecios ? 'bg-violet-600' : 'bg-emerald-600'}`}>
          {initials(cliente.nombre_completo)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold truncate">{cliente.nombre_completo}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
              <TipoClienteBadge tipo={cliente.tipo_cliente} />
            </div>
            {!cliente.activo && <span className="text-xs text-muted-foreground">Inactivo</span>}
          </div>

          {cliente.tipo_cliente !== 'SOLO_PRECIOS' && <>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">{formatCurrency(cliente.balance)}</span>
            <span className="text-xs text-primary">balance</span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Notificación: {mostrarDias(cliente.dias_notificacion)}
          </p>
          </>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-2.5">
          <Link
            to={`${cliente.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Eye className="size-3" />
            Detalle
          </Link>

          <Link
            to={`${cliente.id}/precios`}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            title="Ver artículos y precios del cliente"
          >
            <Tag className="size-3" />
            Precios
          </Link>
        </div>

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

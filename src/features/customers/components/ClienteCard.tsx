import { Link } from 'react-router'
import { formatCurrency } from '../utils/venta-total'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, Tag, Phone, Bell } from 'lucide-react'
import type { Cliente } from '../types/clientes'
import { useAuthStore } from '@/features/core/store/auth-store'
import { initials } from '@/helpers/string'
import CreditoClienteBadge from './CreditoClienteBadge'
import { mostrarDias } from '../utils/dias-notificacion'

type Props = {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}

export default function ClienteCard({ cliente, onEdit, onDelete }: Props) {
  const user = useAuthStore(s => s.user)
  const isNotAdmin = user?.role !== 'admin'
  const sinCredito = cliente.permitir_credito === false

  return (
    <Card
      className={`group relative gap-3 overflow-hidden border-l-4 ${
        !cliente.activo
          ? 'border-l-muted-foreground/40 opacity-80'
          : sinCredito
            ? 'border-l-violet-500'
            : 'border-l-emerald-500'
      } bg-card p-4 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-2xs ${
            !cliente.activo
              ? 'bg-muted-foreground/70'
              : sinCredito
                ? 'bg-violet-600'
                : 'bg-emerald-600'
          }`}
        >
          {initials(cliente.nombre_completo)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold text-foreground">
                {cliente.nombre_completo}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <Phone className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                <span className="truncate">{cliente.telefono || 'Sin teléfono'}</span>
              </p>
            </div>

            {!cliente.activo && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Inactivo
              </Badge>
            )}
          </div>

          <div className="mt-2">
            <CreditoClienteBadge permitirCredito={cliente.permitir_credito} />
          </div>

          {cliente.permitir_credito === true && (
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-heading text-lg font-bold text-primary tabular-nums">
                {formatCurrency(cliente.balance)}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">balance</span>
            </div>
          )}

          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Bell className="size-3 shrink-0 opacity-65" aria-hidden="true" />
            <span className="truncate">Notif: {mostrarDias(cliente.dias_notificacion)}</span>
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2.5">
        <div className="flex items-center gap-2">
          <Link
            to={`${cliente.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Detalle
          </Link>

          <Link
            to={`${cliente.id}/precios`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            title="Ver precios del cliente"
          >
            <Tag className="size-3.5" aria-hidden="true" />
            Precios
          </Link>
        </div>

        <div className="flex gap-0.5">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onEdit}
            disabled={isNotAdmin}
            aria-label={`Editar ${cliente.nombre_completo}`}
          >
            <Pencil />
          </Button>

          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onDelete}
            disabled={isNotAdmin}
            className="text-destructive/85 hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Eliminar ${cliente.nombre_completo}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  )
}

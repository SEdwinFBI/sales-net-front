import { Card } from '@/components/ui/card'
import { formatCurrency } from '../utils/venta-total'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, MapPin, Phone } from 'lucide-react'
import type { Cliente } from '../types/clientes'
import { initials } from '@/helpers/string'
import { formatDisplayDate } from '@/lib/dates'
import CreditoClienteBadge from './CreditoClienteBadge'
import { mostrarDias } from '../utils/dias-notificacion'

type Props = {
  cliente: Cliente
}

export default function ClienteInfo({ cliente }: Props) {
  return (
    <Card className="border-border/80 bg-muted/25 p-4 shadow-none sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-xs sm:size-14 sm:text-lg ${
              !cliente.activo
                ? 'bg-muted-foreground/70'
                : cliente.permitir_credito === false
                  ? 'bg-violet-600'
                  : 'bg-emerald-600'
            }`}
          >
            {initials(cliente.nombre_completo)}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-lg font-bold text-foreground sm:text-xl">
                {cliente.nombre_completo}
              </h2>

              <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </Badge>

              <CreditoClienteBadge permitirCredito={cliente.permitir_credito} />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Phone className="size-3.5 text-primary/70" aria-hidden="true" />
                <span className="font-medium text-foreground">{cliente.telefono || '—'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary/70" aria-hidden="true" />
                <span className="font-medium text-foreground">{cliente.direccion || 'Sin dirección'}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Bell className="size-3 opacity-70" aria-hidden="true" />
                Días de notificación: {mostrarDias(cliente.dias_notificacion)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3 opacity-70" aria-hidden="true" />
                Cliente desde {formatDisplayDate(cliente.fecha_creacion)}
              </span>
            </div>
          </div>
        </div>

        {cliente.permitir_credito === true && (
          <div className="shrink-0 rounded-2xl border border-primary/20 bg-card px-4 py-3 text-left shadow-2xs sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Balance actual
            </p>
            <p className="mt-0.5 font-heading text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(cliente.balance)}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

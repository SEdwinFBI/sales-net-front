import { Card } from '@/components/ui/card'
import { formatCurrency } from '../utils/venta-total'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '../types/clientes'
import { initials } from '@/helpers/string'
import { formatDisplayDate } from '@/lib/dates'
import CreditoClienteBadge from './CreditoClienteBadge'

type Props = {
  cliente: Cliente
}

export default function ClienteInfo({ cliente }: Props) {
  return (
    <Card className="bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white sm:size-14 ${
              !cliente.activo
                ? 'bg-muted-foreground/70'
                : cliente.permitir_credito === false
                  ? 'bg-violet-600'
                  : 'bg-emerald-600'
            }`}
          >
            {initials(cliente.nombre_completo)}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="truncate text-lg font-bold sm:text-xl">
                {cliente.nombre_completo}
              </h2>

              <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </Badge>

              <CreditoClienteBadge
                permitirCredito={cliente.permitir_credito}
              />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="whitespace-nowrap text-muted-foreground">
                Tel:{' '}
                <span className="font-medium text-foreground">
                  {cliente.telefono}
                </span>
              </span>

              <span className="whitespace-nowrap text-muted-foreground">
                Dirección:{' '}
                <span className="font-medium text-foreground">
                  {cliente.direccion}
                </span>
              </span>
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              Cliente desde {formatDisplayDate(cliente.fecha_creacion)}
            </p>
          </div>
        </div>

        {cliente.permitir_credito === true && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-xl font-bold text-primary sm:text-2xl">
              {formatCurrency(cliente.balance)}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
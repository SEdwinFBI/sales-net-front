import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Cliente } from '../types/clientes'
import { initials } from '@/helpers/string'

type Props = {
  cliente: Cliente
}

export default function ClienteInfo({ cliente }: Props) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isNotificationPast = Boolean(cliente.fecha_notificacion && cliente.fecha_notificacion <= today)

  return (
    <Card className="bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white sm:size-14 ${cliente.activo ? 'bg-successful' : 'bg-muted-foreground/70'}`}>
            {initials(cliente.nombre_completo)}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="truncate text-lg font-bold sm:text-xl">{cliente.nombre_completo}</h2>
              <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="whitespace-nowrap text-muted-foreground">
                Tel: <span className="font-medium text-foreground">{cliente.telefono}</span>
              </span>
              <span className="whitespace-nowrap text-muted-foreground">
                Direccion: <span className="font-medium text-foreground">{cliente.direccion}</span>
              </span>
              <span className="whitespace-nowrap text-muted-foreground">
                Fecha Notificacion: <span className={cn('font-medium text-foreground', isNotificationPast && 'text-danger')}>{cliente.fecha_notificacion ?? "Sin fecha"}</span>
              </span>
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              Cliente desde {new Date(cliente.fecha_creacion).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-xl font-bold text-primary sm:text-2xl">
            Q{Number(cliente.balance).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  )
}

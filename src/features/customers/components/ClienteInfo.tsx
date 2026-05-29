import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '../types/clientes'

type Props = {
  cliente: Cliente
}

const initials = (name: string) =>
  name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function ClienteInfo({ cliente }: Props) {
  return (
    <Card className="bg-white p-6">
      <div className="flex items-start gap-4">
        <div className={`flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${cliente.activo ? 'bg-emerald-500' : 'bg-stone-400'}`}>
          {initials(cliente.nombre_completo)}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
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
              <p className="font-medium">{cliente.fecha_notificacion}</p>
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

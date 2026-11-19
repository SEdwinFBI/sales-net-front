import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/helpers/money'
import type { MovimientoCaja } from '../types/cash'
import { EmptyState } from '@/components/ui/empty-state'
import { WalletCards } from 'lucide-react'

export function MovementsTable({ movimientos = [] }: { movimientos?: MovimientoCaja[] }) {
  if (!movimientos.length) {
    return (
      <EmptyState
        icon={WalletCards}
        title="Sin movimientos registrados"
        description="Las entradas y gastos del día aparecerán aquí."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Observación</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-muted-foreground">
                {new Date(m.fecha).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                <Badge variant={m.tipo === 'SALIDA' ? 'destructive' : 'secondary'}>
                  {m.tipo_display}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal text-foreground">{m.observacion}</TableCell>
              <TableCell className="text-muted-foreground">{m.usuario.nombre}</TableCell>
              <TableCell
                className={`text-right font-semibold ${
                  m.tipo === 'SALIDA' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {m.tipo === 'SALIDA' ? '−' : '+'}
                {formatCurrency(Number(m.monto))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

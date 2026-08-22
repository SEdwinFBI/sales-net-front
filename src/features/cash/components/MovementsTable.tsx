import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/helpers/money'
import type { MovimientoCaja } from '../types/cash'
import { EmptyState } from '@/components/ui/empty-state'
import { WalletCards } from 'lucide-react'

export function MovementsTable({ movimientos = [] }: { movimientos?: MovimientoCaja[] }) {
  if (!movimientos.length) return <EmptyState icon={WalletCards} title="No hay movimientos registrados" description="Las entradas y gastos del día aparecerán aquí." />
  return <Table>
    <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Observación</TableHead><TableHead>Usuario</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
    <TableBody>{movimientos.map((m) => <TableRow key={m.id}>
      <TableCell>{new Date(m.fecha).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</TableCell>
      <TableCell><Badge variant={m.tipo === 'SALIDA' ? 'destructive' : 'secondary'}>{m.tipo_display}</Badge></TableCell>
      <TableCell className="max-w-xs whitespace-normal">{m.observacion}</TableCell>
      <TableCell>{m.usuario.nombre}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(Number(m.monto))}</TableCell>
    </TableRow>)}</TableBody>
  </Table>
}

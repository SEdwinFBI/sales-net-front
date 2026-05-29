import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Abono } from '../types/clientes'

type Props = {
  abonos: Abono[]
}

export default function AbonosTable({ abonos }: Props) {
  if (abonos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay abonos registrados para este cliente.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Venta ID</TableHead>
            <TableHead>Total venta</TableHead>
            <TableHead>Estado venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {abonos.map((abono) => (
            <TableRow key={abono.id}>
              <TableCell className="font-mono text-xs">{abono.id}</TableCell>
              <TableCell className="font-semibold text-primary">Q{Number(abono.monto).toFixed(2)}</TableCell>
              <TableCell>{abono.fecha_abono}</TableCell>
              <TableCell className="font-mono text-xs">{abono.id_venta}</TableCell>
              <TableCell>Q{Number(abono.venta_total).toFixed(2)}</TableCell>
              <TableCell>{abono.venta_estado}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

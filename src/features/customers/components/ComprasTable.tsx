import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Venta } from '@/features/sales/types/sales'
import type { ComprasData } from '../types/clientes'

type Props = {
  ventas: Venta[]
  resumen?: ComprasData['resumen']
}

export default function ComprasTable({ ventas, resumen }: Props) {
  return (
    <div className="space-y-4">
      {resumen && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Total ventas</p>
            <p className="text-xl font-bold">{resumen.total_ventas}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Total general</p>
            <p className="text-xl font-bold text-primary">Q{Number(resumen.total_general).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Total pendiente</p>
            <p className="text-xl font-bold text-amber-600">Q{Number(resumen.total_pendiente).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Balance cliente</p>
            <p className="text-xl font-bold text-primary">Q{Number(resumen.balance_cliente).toFixed(2)}</p>
          </div>
        </div>
      )}

      {ventas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No hay compras registradas.
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Forma de pago</TableHead>
                <TableHead>Vendedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell className="font-mono text-xs">{venta.id}</TableCell>
                  <TableCell>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold">Q{Number(venta.total).toFixed(2)}</TableCell>
                  <TableCell>{venta.estado}</TableCell>
                  <TableCell className="capitalize">{venta.forma_pago}</TableCell>
                  <TableCell>{venta.vendedor.full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

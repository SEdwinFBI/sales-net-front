import { Receipt } from 'lucide-react'
import type { Venta } from '@/features/sales/types/sales'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  ventas: Venta[]
}

export default function ComprasTable({ ventas }: Props) {
  return (
    <div className="space-y-4">
      {ventas.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay compras registradas." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Abonado</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Forma de pago</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => {
              const date = new Date(venta.fecha)

              return (
                <TableRow key={venta.id}>
                  <TableCell className="font-mono text-xs">{venta.id}</TableCell>
                  <TableCell>
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="font-semibold">Q{Number(venta.total).toFixed(2)}</TableCell>
                  <TableCell className="text-warning">Q{Number(venta.abonado).toFixed(2)}</TableCell>
                  <TableCell className="text-destructive">Q{Number(venta.saldo).toFixed(2)}</TableCell>
                  <TableCell>{venta.estado}</TableCell>
                  <TableCell className="capitalize">{venta.forma_pago}</TableCell>
                  <TableCell>{venta.vendedor.full_name}</TableCell>
                  <TableCell>
                    {venta.observacion || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
          </div>
        </div>
      )}
    </div>
  )
}

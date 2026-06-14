import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Receipt } from 'lucide-react'
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
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl shadow-sm bg-white p-4">
            <p className="text-xs text-muted-foreground">Total ventas</p>
            <p className="text-xl font-bold">{resumen.total_ventas}</p>
          </div>
          <div className="rounded-xl shadow-sm bg-white p-4">
            <p className="text-xs text-muted-foreground">Total general</p>
            <p className="text-xl font-bold text-primary">Q{Number(resumen.total_general).toFixed(2)}</p>
          </div>
          <div className="rounded-xl shadow-sm bg-white p-4">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="text-xl font-bold text-successful">Q{Number(resumen.total_pagado).toFixed(2)}</p>
          </div>
          <div className="rounded-xl shadow-sm bg-white p-4">
            <p className="text-xs text-muted-foreground">Abonado</p>
            <p className="text-xl font-bold text-warning">Q{Number(resumen.total_abonado).toFixed(2)}</p>
          </div>
          <div className="rounded-xl shadow-sm bg-white p-4">
            <p className="text-xs text-muted-foreground">Balance (deuda)</p>
            <p className="text-xl font-bold text-destructive">Q{Number(resumen.balance).toFixed(2)}</p>
          </div>
        </div>
      )}

      {ventas.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay compras registradas." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell className="font-mono text-xs">{venta.id}</TableCell>
                  <TableCell>{(() => { const d = new Date(venta.fecha); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })()}</TableCell>
                  <TableCell className="font-semibold">Q{Number(venta.total).toFixed(2)}</TableCell>
                  <TableCell className="text-warning">Q{Number(venta.abonado).toFixed(2)}</TableCell>
                  <TableCell className="text-destructive">Q{Number(venta.saldo).toFixed(2)}</TableCell>
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

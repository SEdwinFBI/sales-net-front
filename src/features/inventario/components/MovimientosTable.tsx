'use no memo';
import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  PackagePlus,
  SearchX,
  Settings2,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/helpers/money'
import type { Movimiento, TipoMovimiento } from '../types/inventario'

type Props = {
  movimientos: Movimiento[]
  isLoading: boolean
  /** Oculta la columna de vendedor cuando ya está agrupado por él. */
  ocultarVendedor?: boolean
}

/** Icono y color por tipo, para leer la tabla de un vistazo. */
const TIPO_CONFIG: Record<TipoMovimiento, { icon: LucideIcon; className: string }> = {
  STOCK_VENTA: { icon: ShoppingCart, className: 'text-destructive' },
  STOCK_RESURTIDO: { icon: PackagePlus, className: 'text-successful' },
  STOCK_AJUSTE: { icon: Settings2, className: 'text-warning' },
  STOCK_CARGA_INICIAL: { icon: PackagePlus, className: 'text-primary' },
  SALDO_VENTA_CREDITO: { icon: Wallet, className: 'text-destructive' },
  SALDO_ABONO: { icon: Wallet, className: 'text-successful' },
  SALDO_CANCELACION: { icon: Wallet, className: 'text-muted-foreground' },
  SALDO_INICIAL: { icon: Wallet, className: 'text-primary' },
  SALDO_AJUSTE: { icon: Settings2, className: 'text-warning' },
}

function formatearFecha(iso: string) {
  const fecha = new Date(iso)
  return `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

/** Entero con signo explícito: el signo es la información principal. */
function conSigno(valor: number) {
  return `${valor > 0 ? '+' : ''}${formatNumber(valor)}`
}

export default function MovimientosTable({ movimientos, isLoading, ocultarVendedor }: Props) {
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({})

  const alternar = (id: number) =>
    setExpandidos((previo) => ({ ...previo, [id]: !previo[id] }))

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    )
  }

  if (movimientos.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin movimientos"
        description="No hay movimientos que coincidan con los filtros seleccionados."
      />
    )
  }

  const columnas = ocultarVendedor ? 7 : 8

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            {!ocultarVendedor && <TableHead>Vendedor</TableHead>}
            <TableHead className="text-right">Unidades</TableHead>
            <TableHead>Venta</TableHead>
            <TableHead>Registró</TableHead>
            <TableHead>Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((movimiento, i) => {
            const config = TIPO_CONFIG[movimiento.tipo]
            const Icono = config?.icon ?? Settings2
            const abierto = Boolean(expandidos[movimiento.id])

            return (
              <React.Fragment key={movimiento.id}>
                <TableRow className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  <TableCell>
                    <Button
                      aria-label={abierto ? 'Ocultar líneas del movimiento' : 'Ver líneas del movimiento'}
                      size="icon-xs"
                      variant="ghost"
                      className="size-6"
                      onClick={() => alternar(movimiento.id)}
                    >
                      {abierto ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatearFecha(movimiento.fecha)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <Icono className={`size-4 shrink-0 ${config?.className ?? ''}`} />
                      <span className="text-sm">{movimiento.tipo_display}</span>
                    </span>
                  </TableCell>
                  {!ocultarVendedor && (
                    <TableCell className="text-sm">
                      {movimiento.usuario_afectado?.full_name
                        || movimiento.usuario_afectado?.username
                        || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${movimiento.total_unidades >= 0 ? 'text-successful' : 'text-destructive'}`}
                    >
                      {conSigno(movimiento.total_unidades)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Es el unico vinculo con el movimiento de saldo del
                        cliente, que es un movimiento distinto y vive aparte. */}
                    {movimiento.id_venta ? (
                      <span className="font-mono text-xs">#{movimiento.id_venta}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {movimiento.usuario_registra?.full_name
                      || movimiento.usuario_registra?.username
                      || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {movimiento.observacion || '—'}
                  </TableCell>
                </TableRow>

                {abierto && (
                  <TableRow>
                    <TableCell colSpan={columnas} className="bg-gradient-to-br from-muted/30 to-card p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Líneas del movimiento
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-border bg-card">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/20">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Artículo</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Talla</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Había</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Movimiento</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Quedó</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movimiento.detalles.map((detalle) => (
                              <tr key={detalle.id} className="border-b border-border/50 last:border-0">
                                <td className="px-3 py-2">{detalle.articulo ?? '—'}</td>
                                <td className="px-3 py-2">{detalle.talla ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(detalle.cantidad_anterior)}</td>
                                <td
                                  className={`px-3 py-2 text-right font-semibold ${detalle.cantidad >= 0 ? 'text-successful' : 'text-destructive'}`}
                                >
                                  {conSigno(detalle.cantidad)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {formatNumber(detalle.cantidad_resultante)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

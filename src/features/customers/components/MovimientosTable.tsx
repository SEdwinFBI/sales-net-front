'use no memo';
import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { Banknote, Receipt, Scale, Search, ShoppingBag, Wallet, XCircle, type LucideIcon } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import type { MovimientoCliente, TipoMovimiento } from '../types/clientes'
import { formatCurrency } from '../utils/venta-total'

type Props = {
  movimientos: MovimientoCliente[]
}


const formatDate = (value: string) => {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const TIPO_CONFIG: Record<TipoMovimiento, { icon: LucideIcon; iconClassName: string }> = {
  VENTA_CREDITO: { icon: ShoppingBag, iconClassName: 'bg-secondary text-secondary-foreground' },
  ABONO: { icon: Banknote, iconClassName: 'bg-primary/10 text-primary' },
  CANCELACION: { icon: XCircle, iconClassName: 'bg-muted text-muted-foreground' },
  SALDO_INICIAL: { icon: Wallet, iconClassName: 'bg-muted text-muted-foreground' },
  AJUSTE: { icon: Scale, iconClassName: 'bg-muted text-muted-foreground' },
}

const getMovimientoSearchText = (movimiento: MovimientoCliente) => [
  movimiento.tipo,
  movimiento.tipo_display,
  movimiento.id_venta,
  movimiento.fecha,
  movimiento.descripcion,
  movimiento.usuario?.full_name,
  movimiento.usuario?.username,
  movimiento.monto,
  movimiento.saldo_anterior,
  movimiento.saldo_resultante,
].filter(Boolean).join(' ')

export default function MovimientosTable({ movimientos }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo<ColumnDef<MovimientoCliente>[]>(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      sortingFn: 'datetime',
    },
    {
      id: 'busqueda',
      accessorFn: getMovimientoSearchText,
      header: 'Busqueda',
      enableSorting: false,
    },
  ], [])

  const table = useReactTable({
    data: movimientos,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const visibleRows = table.getRowModel().rows
  const hasFilters = columnFilters.length > 0
  const searchValue = (table.getColumn('busqueda')?.getFilterValue() ?? '') as string

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Movimientos generales</h3>
        <p className="text-sm text-muted-foreground">Flujo del saldo del cliente: cada movimiento muestra cuánto afectó la deuda y el saldo resultante.</p>
      </div>

      {movimientos.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay movimientos registrados." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} de {movimientos.length} movimientos
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={searchValue}
                    onChange={(event) => table.getColumn('busqueda')?.setFilterValue(event.target.value || undefined)}
                    placeholder="Buscar movimiento..."
                    className="h-9 w-full pl-9"
                  />
                </div>
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Sin resultados para la busqueda
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {visibleRows.map((row) => {
                  const movimiento = row.original
                  const monto = Number(movimiento.monto)
                  const aumentaDeuda = monto > 0
                  const saldoResultante = Number(movimiento.saldo_resultante)
                  const config = TIPO_CONFIG[movimiento.tipo] ?? TIPO_CONFIG.AJUSTE
                  const MovimientoIcon = config.icon
                  const montoClassName = aumentaDeuda ? 'text-destructive' : 'text-successful'
                  const saldoClassName = saldoResultante > 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-successful/10 text-successful'
                  const responsable = movimiento.usuario?.full_name || movimiento.usuario?.username || null

                  return (
                    <article key={row.id} className="px-3 py-3 transition-colors hover:bg-muted/20 sm:px-4">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="flex min-w-0 gap-3">
                          <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${config.iconClassName}`}>
                            <MovimientoIcon className="size-4" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {movimiento.tipo_display}
                              </span>
                              <p className={`text-sm font-semibold ${montoClassName}`}>
                                {aumentaDeuda ? '+' : '-'}{formatCurrency(Math.abs(monto))}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(movimiento.fecha)}
                              {movimiento.id_venta ? ` - Venta #${movimiento.id_venta}` : ''}
                              {responsable ? ` - ${responsable}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pl-12 sm:justify-end sm:pl-0">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${saldoClassName}`}>
                            Saldo {formatCurrency(Number(movimiento.saldo_anterior))} → {formatCurrency(saldoResultante)}
                          </span>
                        </div>

                        {movimiento.descripcion && (
                          <div className="pl-12 sm:col-span-2">
                            <p className="line-clamp-2 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                              {movimiento.descripcion}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {hasFilters && (
              <div className="border-t border-border/50 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground">
                {table.getFilteredRowModel().rows.length} de {movimientos.length} resultados
              </div>
            )}
          </div>

          <TablePagination table={table} />
        </>
      )}
    </div>
  )
}

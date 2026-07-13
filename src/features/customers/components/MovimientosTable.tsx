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
import { Banknote, Receipt, ShoppingBag } from 'lucide-react'
import type { Venta } from '@/features/sales/types/sales'
import TablePagination from '@/components/shared/table/TablePagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import type { Abono } from '../types/clientes'

type MovimientoBase = {
  fecha: string
  idMovimiento: number
  idVenta: number
  totalVenta: number
  abonado: number
  saldo: number
  estado: string
  formaPago: string | null
  responsable: string | null
  observacion: string | null
}

type MovimientoCompra = MovimientoBase & {
  tipo: 'Compra'
  compra: Venta
}

type MovimientoAbono = MovimientoBase & {
  tipo: 'Abono'
  abono: Abono
}

type Movimiento = MovimientoCompra | MovimientoAbono

type Props = {
  ventas: Venta[]
  abonos: Abono[]
}

const formatCurrency = (value: number) => `Q${Number(value).toFixed(2)}`

const getVentaTotal = (venta: Venta) => {
  const totalNeto = Number(venta.total_neto)
  const total = Number(venta.total)
  const totalDesdeSaldo = Number(venta.abonado) + Number(venta.saldo)

  if (totalNeto > 0) return totalNeto
  if (total > 0) return total
  return totalDesdeSaldo
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const getMovimientoSearchText = (movimiento: Movimiento) => [
  movimiento.tipo,
  movimiento.idMovimiento,
  movimiento.idVenta,
  movimiento.fecha,
  movimiento.estado,
  movimiento.formaPago,
  movimiento.responsable,
  movimiento.observacion,
  movimiento.totalVenta,
  movimiento.abonado,
  movimiento.saldo,
].filter(Boolean).join(' ')

export default function MovimientosTable({ ventas, abonos }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const movimientos = useMemo<Movimiento[]>(() => [
    ...ventas.map<MovimientoCompra>((venta) => ({
      tipo: 'Compra',
      fecha: venta.fecha,
      idMovimiento: venta.id,
      idVenta: venta.id,
      totalVenta: getVentaTotal(venta),
      abonado: Number(venta.abonado),
      saldo: Number(venta.saldo),
      estado: venta.estado,
      formaPago: venta.forma_pago,
      responsable: venta.vendedor.full_name,
      observacion: venta.observacion ?? null,
      compra: venta,
    })),
    ...abonos.map<MovimientoAbono>((abono) => ({
      tipo: 'Abono',
      fecha: abono.fecha_abono,
      idMovimiento: abono.id,
      idVenta: abono.id_venta,
      totalVenta: Number(abono.venta_total),
      abonado: Number(abono.monto),
      saldo: Number(abono.saldo_restante),
      estado: abono.venta_estado,
      formaPago: null,
      responsable: abono.usuario?.full_name || abono.usuario?.username || null,
      observacion: abono.observacion ?? null,
      abono,
    })),
  ], [ventas, abonos])

  const columns = useMemo<ColumnDef<Movimiento>[]>(() => [
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold">Movimientos generales</h3>
          <p className="text-sm text-muted-foreground">Compras y abonos ordenados del mas reciente al mas antiguo.</p>
        </div>
        {movimientos.length > 0 && (
          <Input
            value={searchValue}
            onChange={(event) => table.getColumn('busqueda')?.setFilterValue(event.target.value || undefined)}
            placeholder="Buscar movimiento..."
            className="h-9 w-full sm:w-72"
          />
        )}
      </div>

      {movimientos.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay movimientos registrados." />
      ) : (
        <>
          <div className="space-y-2">
            {visibleRows.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-white px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
                Sin resultados para la busqueda
              </div>
            ) : (
              <>
                {visibleRows.map((row) => {
                  const movimiento = row.original
                  const isCompra = movimiento.tipo === 'Compra'
                  const MovimientoIcon = isCompra ? ShoppingBag : Banknote
                  const mainAmount = isCompra ? movimiento.totalVenta : movimiento.abonado
                  const title = isCompra
                    ? `Compra por ${formatCurrency(mainAmount)}`
                    : `Abono de ${formatCurrency(mainAmount)}`
                  const iconClassName = isCompra
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary/10 text-primary'
                  const saldoClassName = movimiento.saldo > 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-successful/10 text-successful'

                  return (
                    <article key={row.id} className="rounded-lg border border-border/70 bg-white px-3 py-3 shadow-sm transition-colors hover:bg-muted/20 sm:px-4">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
                          <MovimientoIcon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-foreground">{title}</p>
                              <p className="text-xs text-muted-foreground">
                                Venta #{movimiento.idVenta} - {formatDate(movimiento.fecha)}
                                {movimiento.responsable ? ` - ${movimiento.responsable}` : ''}
                              </p>
                            </div>

                            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${saldoClassName}`}>
                              Saldo {formatCurrency(movimiento.saldo)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                              {movimiento.estado}
                            </span>
                            {isCompra && movimiento.formaPago && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground capitalize">
                                {movimiento.formaPago}
                              </span>
                            )}
                            {isCompra && movimiento.abonado > 0 && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground capitalize">
                                Abonado: {formatCurrency(movimiento.abonado)}
                              </span>
                            )}
                          </div>

                          {movimiento.observacion && (
                            <p className="line-clamp-2 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                              {movimiento.observacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </>
            )}

            {hasFilters && (
              <div className="rounded-lg border border-border/50 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground">
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

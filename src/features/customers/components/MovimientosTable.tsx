import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Receipt, Search } from 'lucide-react'
import type { Venta } from '@/features/sales/types/sales'
import TablePagination from '@/components/shared/table/TablePagination'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Abono, ComprasData } from '../types/clientes'

type MovimientoBase = {
  fecha: string
  idMovimiento: number
  idVenta: number
  totalVenta: number
  abonado: number
  saldo: number
  estado: string
  formaPago: string | null
  vendedor: string | null
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
  resumen?: ComprasData['resumen']
}

const formatCurrency = (value: number) => `Q${Number(value).toFixed(2)}`

const formatDate = (value: string) => {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const globalSearch: FilterFn<Movimiento> = (row, _columnId, filterValue) => {
  const movimiento = row.original
  const searchableText = [
    movimiento.tipo,
    formatDate(movimiento.fecha),
    movimiento.idMovimiento,
    movimiento.idVenta,
    movimiento.totalVenta,
    movimiento.abonado,
    movimiento.saldo,
    movimiento.estado,
    movimiento.formaPago,
    movimiento.vendedor,
    movimiento.observacion,
  ].join(' ').toLowerCase()

  return searchableText.includes(String(filterValue).trim().toLowerCase())
}

export default function MovimientosTable({ ventas, abonos, resumen }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')

  const movimientos = useMemo<Movimiento[]>(() => [
    ...ventas.map<MovimientoCompra>((venta) => ({
      tipo: 'Compra',
      fecha: venta.fecha,
      idMovimiento: venta.id,
      idVenta: venta.id,
      totalVenta: Number(venta.total),
      abonado: Number(venta.abonado),
      saldo: Number(venta.saldo),
      estado: venta.estado,
      formaPago: venta.forma_pago,
      vendedor: venta.vendedor.full_name,
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
      vendedor: null,
      observacion: abono.observacion ?? null,
      abono,
    })),
  ], [ventas, abonos])

  const columns = useMemo<ColumnDef<Movimiento>[]>(() => [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.tipo === 'Compra' ? 'secondary' : 'default'}>
          {row.original.tipo}
        </Badge>
      ),
    },
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      sortingFn: 'datetime',
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.fecha)}</span>,
    },
    {
      accessorKey: 'idMovimiento',
      header: 'Movimiento',
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono text-xs">
          {row.original.tipo} #{row.original.idMovimiento}
        </span>
      ),
    },
    {
      accessorKey: 'idVenta',
      header: 'Venta',
      cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">Venta #{row.original.idVenta}</span>,
    },
    {
      accessorKey: 'totalVenta',
      header: 'Total venta',
      cell: ({ row }) => <span className="whitespace-nowrap font-semibold">{formatCurrency(row.original.totalVenta)}</span>,
    },
    {
      accessorKey: 'abonado',
      header: 'Abonado',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-warning">{formatCurrency(row.original.abonado)}</p>
          <p className="text-[10px] text-muted-foreground">
            {row.original.tipo === 'Compra' ? 'Acumulado' : 'Este abono'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      cell: ({ row }) => <span className="whitespace-nowrap text-destructive">{formatCurrency(row.original.saldo)}</span>,
    },
    { accessorKey: 'estado', header: 'Estado' },
    {
      accessorKey: 'formaPago',
      header: 'Forma de pago',
      cell: ({ row }) => row.original.formaPago
        ? <span className="capitalize">{row.original.formaPago}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'vendedor',
      header: 'Vendedor',
      cell: ({ row }) => row.original.vendedor || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'observacion',
      header: 'Observación',
      cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span>,
    },
  ], [])

  const table = useReactTable({
    data: movimientos,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const visibleRows = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold">Movimientos generales</h3>
          <p className="text-sm text-muted-foreground">Compras y abonos ordenados del más reciente al más antiguo.</p>
        </div>

        {movimientos.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar movimiento..."
              aria-label="Buscar movimientos"
              className="pl-9"
            />
          </div>
        )}
      </div>

      {resumen && (
        <div className="grid overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm sm:grid-cols-3">
          <div className="p-4">
            <p className="text-xs text-muted-foreground">Total comprado</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(resumen.total_general)}</p>
          </div>
          <div className="border-t border-border/70 p-4 sm:border-l sm:border-t-0">
            <p className="text-xs text-muted-foreground">Total abonado</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(resumen.total_abonado)}</p>
          </div>
          <div className="border-t border-border/70 p-4 sm:border-l sm:border-t-0">
            <p className="text-xs text-muted-foreground">Deuda</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(resumen.balance)}</p>
          </div>
        </div>
      )}

      {movimientos.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay movimientos registrados." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          <button
                            type="button"
                            className="flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider"
                            onClick={() => header.column.toggleSorting()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="size-3 opacity-40" />
                          </button>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                        Sin resultados para la búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {visibleRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sin resultados para la búsqueda
              </div>
            ) : (
              visibleRows.map((row) => {
                const movimiento = row.original

                return (
                  <article key={row.id} className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge variant={movimiento.tipo === 'Compra' ? 'secondary' : 'default'}>
                          {movimiento.tipo}
                        </Badge>
                        <p className="font-mono text-sm font-semibold">
                          {movimiento.tipo} #{movimiento.idMovimiento}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">Venta #{movimiento.idVenta}</p>
                      </div>
                      <time className="text-right text-xs text-muted-foreground" dateTime={movimiento.fecha}>
                        {formatDate(movimiento.fecha)}
                      </time>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-[11px] text-muted-foreground">Total venta</p>
                        <p className="font-semibold">{formatCurrency(movimiento.totalVenta)}</p>
                      </div>
                      <div className="rounded-lg bg-warning/10 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          {movimiento.tipo === 'Compra' ? 'Abonado acumulado' : 'Este abono'}
                        </p>
                        <p className="font-semibold text-warning">{formatCurrency(movimiento.abonado)}</p>
                      </div>
                      <div className="rounded-lg bg-destructive/10 p-3">
                        <p className="text-[11px] text-muted-foreground">Saldo</p>
                        <p className="font-semibold text-destructive">{formatCurrency(movimiento.saldo)}</p>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">Estado</dt>
                        <dd>{movimiento.estado}</dd>
                      </div>
                      {movimiento.formaPago && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Forma de pago</dt>
                          <dd className="capitalize">{movimiento.formaPago}</dd>
                        </div>
                      )}
                      {movimiento.vendedor && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Vendedor</dt>
                          <dd>{movimiento.vendedor}</dd>
                        </div>
                      )}
                    </dl>

                    {movimiento.observacion && (
                      <div className="mt-4 border-t border-border/60 pt-3">
                        <p className="text-xs text-muted-foreground">Observación</p>
                        <p className="text-sm">{movimiento.observacion}</p>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>

          {globalFilter && (
            <p className="text-xs text-muted-foreground">
              {table.getFilteredRowModel().rows.length} de {movimientos.length} movimientos
            </p>
          )}

          <TablePagination table={table} />
        </>
      )}
    </div>
  )
}

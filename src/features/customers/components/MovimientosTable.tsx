import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Receipt } from 'lucide-react'
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
  referencia: string
  monto: number
  saldo: number
  estado: string
  informacion: string
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

const includesText: FilterFn<Movimiento> = (row, columnId, filterValue) =>
  String(row.getValue(columnId)).toLowerCase().includes(String(filterValue).toLowerCase())

export default function MovimientosTable({ ventas, abonos, resumen }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const movimientos = useMemo<Movimiento[]>(() => [
    ...ventas.map<MovimientoCompra>((venta) => ({
      tipo: 'Compra',
      fecha: venta.fecha,
      referencia: `Compra #${venta.id}`,
      monto: Number(venta.total),
      saldo: Number(venta.saldo),
      estado: venta.estado,
      informacion: `${venta.forma_pago} · ${venta.vendedor.full_name} · Abonado ${formatCurrency(venta.abonado)}`,
      observacion: venta.observacion ?? null,
      compra: venta,
    })),
    ...abonos.map<MovimientoAbono>((abono) => ({
      tipo: 'Abono',
      fecha: abono.fecha_abono,
      referencia: `Abono #${abono.id}`,
      monto: Number(abono.monto),
      saldo: Number(abono.saldo_restante),
      estado: abono.venta_estado,
      informacion: `Venta #${abono.id_venta} · Total ${formatCurrency(abono.venta_total)}`,
      observacion: abono.observacion ?? null,
      abono,
    })),
  ], [ventas, abonos])

  const columns = useMemo<ColumnDef<Movimiento>[]>(() => [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      filterFn: includesText,
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
      filterFn: includesText,
      cell: ({ row }) => formatDate(row.original.fecha),
    },
    {
      accessorKey: 'referencia',
      header: 'Referencia',
      filterFn: includesText,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.referencia}</span>,
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      filterFn: includesText,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{formatCurrency(row.original.monto)}</span>
      ),
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      filterFn: includesText,
      cell: ({ row }) => (
        <span className="text-destructive">{formatCurrency(row.original.saldo)}</span>
      ),
    },
    { accessorKey: 'estado', header: 'Estado', filterFn: includesText },
    {
      accessorKey: 'informacion',
      header: 'Información',
      filterFn: includesText,
      cell: ({ row }) => <span className="capitalize">{row.original.informacion}</span>,
    },
    {
      accessorKey: 'observacion',
      header: 'Observación',
      filterFn: includesText,
      cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span>,
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

  const hasFilters = columnFilters.length > 0

  return (
    <div className="space-y-4">
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
          <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          <div className="min-w-28 space-y-0.5">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                              onClick={() => header.column.toggleSorting()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <ArrowUpDown className="size-3 opacity-40" />
                            </button>
                            <Input
                              value={(header.column.getFilterValue() ?? '') as string}
                              onChange={(event) => header.column.setFilterValue(event.target.value || undefined)}
                              placeholder="Filtrar..."
                              className="h-7 rounded-none border-0 border-b border-transparent px-0 text-[11px] placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0"
                            />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
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

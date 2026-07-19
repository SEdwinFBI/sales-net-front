'use no memo';
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
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Receipt } from 'lucide-react'
import type { Venta } from '@/features/sales/types/sales'
import TablePagination from '@/components/shared/table/TablePagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { formatCurrency, getVentaTotal } from '../utils/venta-total'
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
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo<ColumnDef<Venta>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.original.fecha)
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      },
    },
    {
      id: 'total',
      accessorFn: (venta) => getVentaTotal(venta),
      header: 'Total',
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(getVentaTotal(row.original))}</span>,
    },
    {
      accessorKey: 'abonado',
      header: 'Abonado',
      cell: ({ row }) => <span className="text-warning">{formatCurrency(row.original.abonado)}</span>,
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      cell: ({ row }) => <span className="text-destructive">{formatCurrency(row.original.saldo)}</span>,
    },
    { accessorKey: 'estado', header: 'Estado' },
    {
      accessorKey: 'forma_pago',
      header: 'Forma de pago',
      cell: ({ row }) => <span className="capitalize">{row.original.forma_pago}</span>,
    },
    {
      id: 'vendedor',
      accessorFn: (venta) => venta.vendedor.full_name,
      header: 'Vendedor',
      cell: ({ row }) => row.original.vendedor.full_name,
    },
    {
      accessorKey: 'observacion',
      header: 'Observación',
      cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span>,
    },
  ], [])

  const table = useReactTable({
    data: ventas,
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

  if (ventas.length === 0) {
    return <EmptyState icon={Receipt} size="sm" title="No hay compras registradas." />
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <div className="space-y-0.5">
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
            {table.getFilteredRowModel().rows.length} de {ventas.length} resultados
          </div>
        )}
      </div>

      <TablePagination table={table} />
    </>
  )
}

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
import { ArrowUpDown } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Abono } from '../types/clientes'

type Props = {
  abonos: Abono[]
}

export default function AbonosTable({ abonos }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo<ColumnDef<Abono>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ row }) => <span className="font-semibold text-primary">Q{Number(row.original.monto).toFixed(2)}</span>,
    },
    {
      accessorKey: 'fecha_abono',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.original.fecha_abono)
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      },
    },
    {
      accessorKey: 'id_venta',
      header: 'Venta ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id_venta}</span>,
    },
    {
      accessorKey: 'venta_total',
      header: 'Total venta',
      cell: ({ row }) => `Q${Number(row.original.venta_total).toFixed(2)}`,
    },
    {
      accessorKey: 'saldo_restante',
      header: 'Saldo restante',
      cell: ({ row }) => <span className="text-destructive">Q{Number(row.original.saldo_restante).toFixed(2)}</span>,
    },
    { accessorKey: 'venta_estado', header: 'Estado venta' },
    {
      id: 'usuario',
      accessorFn: (abono) => abono.usuario?.full_name || abono.usuario?.username || '',
      header: 'Usuario',
      cell: ({ row }) => row.original.usuario
        ? (
          <div className="whitespace-nowrap">
            <p>{row.original.usuario.full_name || row.original.usuario.username}</p>
            {row.original.usuario.full_name && (
              <p className="text-xs text-muted-foreground">@{row.original.usuario.username}</p>
            )}
          </div>
        )
        : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'observacion',
      header: 'Observación',
      cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span>,
    },
  ], [])

  const table = useReactTable({
    data: abonos,
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

  if (abonos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay abonos registrados para este cliente.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
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
            {table.getFilteredRowModel().rows.length} de {abonos.length} resultados
          </div>
        )}
      </div>

      <TablePagination table={table} />
    </>
  )
}

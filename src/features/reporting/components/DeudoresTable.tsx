import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Search, Eye } from 'lucide-react'
import type { ReporteDeudores } from '../types/reportes'

type Row = ReporteDeudores['data']['clientes'][number]

type Props = {
  data: Row[]
  isLoading: boolean
}

export default function DeudoresTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: 'nombre_completo', header: 'Cliente' },
    { accessorKey: 'telefono', header: 'Teléfono' },
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="font-semibold text-primary">Q{Number(row.original.balance).toFixed(2)}</span> },
    { accessorKey: 'total_ventas_pendientes', header: 'Pendiente de cancelar', cell: ({ row }) => `Q${Number(row.original.total_ventas_pendientes).toFixed(2)}` },
    { accessorKey: 'total_abonado', header: 'Total abonado', cell: ({ row }) => `Q${Number(row.original.total_abonado).toFixed(2)}` },
    { accessorKey: 'ultima_compra', header: 'Última compra', cell: ({ row }) => row.original.ultima_compra ?? '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link to={`/clientes/listado/${row.original.id}`}>
          <Button size="icon-xs" variant="ghost">
            <Eye className="size-3.5" />
          </Button>
        </Link>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-white p-6">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 rounded bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar deudor..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <button
                      className="flex items-center gap-1 font-medium text-xs"
                      onClick={() => header.column.toggleSorting()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.id !== 'actions' && <ArrowUpDown className="size-3" />}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No hay deudores registrados.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

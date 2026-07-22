'use no memo';
import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Eye } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import type { ReporteDeudores } from '../types/reportes'

type Row = ReporteDeudores['data']['clientes'][number]

type Props = {
  data: Row[]
  isLoading: boolean
}

export default function DeudoresTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: 'nombre_completo', header: 'Cliente' },
    { accessorKey: 'direccion', header: 'Lugar', cell: ({ row }) => row.original.direccion || 'N/A' },
    { accessorKey: 'telefono', header: 'Teléfono' },
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="font-semibold text-primary">Q{Number(row.original.balance).toFixed(2)}</span> },
    { accessorKey: 'total_ventas_pendientes', header: 'Pendiente de cancelar', cell: ({ row }) => `Q${Number(row.original.total_ventas_pendientes).toFixed(2)}` },
    { accessorKey: 'total_abonado', header: 'Total abonado', cell: ({ row }) => `Q${Number(row.original.total_abonado).toFixed(2)}` },
    { accessorKey: 'fecha_notificacion', header: 'Fecha notificación', cell: ({ row }) => row.original.fecha_notificacion || 'N/A' },
    { accessorKey: 'ultima_compra', header: 'Última compra', cell: ({ row }) => {
      if (!row.original.ultima_compra) return '—'
      const d = new Date(row.original.ultima_compra)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link to={`/clientes/listado/${row.original.id}`}>
            <Button size="icon-xs" variant="ghost" aria-label={`Ver detalle de ${row.original.nombre_completo}`}>
            <Eye className="size-3.5" />
          </Button>
        </Link>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 rounded bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div className="space-y-0.5">
                      {header.column.id !== 'actions' && (
                        <button
                          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                          onClick={() => header.column.toggleSorting()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="size-3 opacity-40" />
                        </button>
                      )}
                    </div>
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
      <TablePagination table={table} />
    </>
  )
}

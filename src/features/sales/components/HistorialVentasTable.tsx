import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronRight, ArrowUpDown, SearchX } from 'lucide-react'
import type { Venta } from '../types/sales'

type Props = {
  data: Venta[]
  isLoading: boolean
}

export default function HistorialVentasTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo<ColumnDef<Venta>[]>(() => [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); row.toggleExpanded() }}
            className="size-6"
          >
            {row.getIsExpanded() ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </Button>
        ) : null,
    },
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString() },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-semibold">Q{Number(row.original.total).toFixed(2)}</span> },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado
        const variant = estado === 'COMPLETADA' ? 'default' as const : estado === 'CANCELADA' ? 'destructive' as const : 'secondary' as const
        return <Badge variant={variant}>{estado}</Badge>
      },
    },
    {
      accessorKey: 'forma_pago',
      header: 'Forma de pago',
      cell: ({ row }) => <span className="capitalize">{row.original.forma_pago}</span>,
    },
    { id: 'vendedor', header: 'Vendedor', accessorFn: (row) => row.vendedor.full_name },
    { id: 'cliente', header: 'Cliente', accessorFn: (row) => row.cliente_info.nombre_completo },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded, columnFilters },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowCanExpand: () => true,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {columnFilters.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-primary/5 px-4 py-1.5">
          <SearchX className="size-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} de {data.length} resultados
          </span>
          <button
            onClick={() => setColumnFilters([])}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.id === 'expand' ? 'w-10' : ''}>
                  {header.column.id === 'expand' ? null : (
                    <div className="space-y-0.5">
                      <button
                        className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                        onClick={() => header.column.toggleSorting()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3 opacity-40" />
                      </button>
                      <Input
                        value={(header.column.getFilterValue() ?? '') as string}
                        onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                        placeholder="Filtrar..."
                        className="h-5 text-[11px] border-0 border-b border-transparent rounded-none px-0 focus-visible:border-primary focus-visible:ring-0 placeholder:text-muted-foreground/40"
                      />
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <SearchX className="size-5 opacity-50" />
                  <span className="text-sm">No hay ventas registradas.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <>
                <TableRow key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={`${row.id}-detail`}>
                    <TableCell colSpan={columns.length} className="bg-gradient-to-br from-muted/30 to-white p-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Detalle de la venta</p>
                        <div className="rounded-lg border border-border bg-white">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-muted/20">
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Artículo</th>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Talla</th>
                                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cantidad</th>
                                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Precio unit.</th>
                                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Descuento</th>
                                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.original.detalles.map((d) => (
                                <tr key={d.id} className="border-b border-border/50 last:border-0">
                                  <td className="px-3 py-2">{d.articulo}</td>
                                  <td className="px-3 py-2">{d.talla}</td>
                                  <td className="px-3 py-2 text-right">{d.cantidad}</td>
                                  <td className="px-3 py-2 text-right">Q{Number(d.precio_unitario).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-red-600">Q{Number(d.descuento).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-medium">Q{Number(d.monto).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

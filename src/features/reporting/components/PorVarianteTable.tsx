import { Fragment, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type ExpandedState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, SearchX, ChevronRight, ChevronDown } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import type { ReporteVentaItem } from '../types/reportes'

type Row = ReporteVentaItem

type Props = {
  data: Row[]
  isLoading: boolean
}

export default function PorVarianteTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      id: 'expander',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          aria-label={row.getIsExpanded() ? 'Ocultar ventas de la variante' : 'Ver ventas de la variante'}
          onClick={(e) => { e.stopPropagation(); row.toggleExpanded() }}
          className="p-0.5 hover:bg-muted/60 rounded"
        >
          {row.getIsExpanded() ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      ),
      size: 32,
      enableSorting: false,
      enableColumnFilter: false,
    },
    { accessorKey: 'articulo', header: 'Artículo' },
    { accessorKey: 'talla', header: 'Talla' },
    { accessorKey: 'unidades', header: 'Unidades' },
    { accessorKey: 'precio_unitario', header: 'Precio base', cell: ({ row }) => `Q${Number(row.original.precio_unitario).toFixed(2)}` },
    { accessorKey: 'precio_promedio', header: 'Precio promedio', cell: ({ row }) => `Q${Number(row.original.precio_promedio).toFixed(2)}` },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-semibold">Q{Number(row.original.total).toFixed(2)}</span> },
    { accessorKey: 'descuento_total', header: 'Descuento', cell: ({ row }) => <span className="text-red-600">Q{Number(row.original.descuento_total).toFixed(2)}</span> },
    { accessorKey: 'total_neto', header: 'Total neto', cell: ({ row }) => <span className="font-semibold">Q{Number(row.original.total_neto).toFixed(2)}</span> },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => row.original.ventas.length > 0,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const hasFilters = columnFilters.length > 0

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.column.id === 'expander' ? 32 : undefined }}>
                  <div className="space-y-0.5">
                    {header.column.id !== 'expander' && (
                      <button
                        className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                        onClick={() => header.column.toggleSorting()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3 opacity-40" />
                      </button>
                    )}
                    {header.column.id !== 'expander' && (
                      <Input
                        value={(header.column.getFilterValue() ?? '') as string}
                        onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                        placeholder="Filtrar..."
                        className="h-7 rounded-none border-0 border-b border-transparent px-0 text-[11px] placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0"
                      />
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
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <SearchX className="size-5 opacity-50" />
                  <span className="text-sm">Sin resultados</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <Fragment key={row.id}>
                <TableRow className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow className="bg-muted/15">
                    <TableCell colSpan={columns.length} className="p-0">
                      <div className="border-t border-border/30 px-6 py-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Ventas de {row.original.articulo} ({row.original.talla})
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-border/50">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-border/30 bg-muted/20">
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ID Venta</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cant.</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Precio u.</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Monto</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Descuento</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">F. Pago</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>
                                <th className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.original.ventas.map((v, vi) => (
                                <tr key={v.id_venta} className={vi % 2 === 0 ? 'bg-white' : 'bg-muted/10'}>
                                  <td className="px-2 py-1 text-[11px] font-mono text-muted-foreground">{v.id_venta}</td>
                                  <td className="px-2 py-1 text-[11px]">{(() => { const d = new Date(v.fecha); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })()}</td>
                                  <td className="px-2 py-1 text-[11px]">{v.cantidad}</td>
                                  <td className="px-2 py-1 text-[11px]">Q{v.precio_unitario.toFixed(2)}</td>
                                  <td className="px-2 py-1 text-[11px] font-semibold">Q{v.monto.toFixed(2)}</td>
                                  <td className="px-2 py-1 text-[11px] text-red-600">Q{v.descuento.toFixed(2)}</td>
                                  <td className="px-2 py-1 text-[11px]">{v.estado}</td>
                                  <td className="px-2 py-1 text-[11px]">{v.forma_pago}</td>
                                  <td className="px-2 py-1 text-[11px]">{v.vendedor.full_name}</td>
                                  <td className="px-2 py-1 text-[11px]">{v.cliente.nombre_completo}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
      {hasFilters && (
        <div className="border-t border-border/50 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {data.length} resultados
        </div>
      )}
    </div>
      <TablePagination table={table} />
    </>
  )
}

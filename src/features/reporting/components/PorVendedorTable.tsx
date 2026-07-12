'use no memo';
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
import type { ReporteVentaVendedor } from '../types/reportes'

type Row = ReporteVentaVendedor

type Props = {
  data: Row[]
  isLoading: boolean
}

export default function PorVendedorTable({ data, isLoading }: Props) {
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
          aria-label={row.getIsExpanded() ? 'Ocultar articulos del vendedor' : 'Ver articulos del vendedor'}
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
    { accessorKey: 'nombre', header: 'Vendedor' },
    { accessorKey: 'cantidad_ventas', header: 'Cant. ventas' },
    { accessorKey: 'unidades', header: 'Unidades' },
    {
      id: 'total_bruto',
      header: 'Total Bruto',
      accessorFn: (row) => Number(row.total_bruto),
      cell: ({ getValue }) => <span className="font-semibold">Q{Number(getValue()).toFixed(2)}</span>,
    },
    {
      id: 'descuento_total',
      header: 'Descuento',
      accessorFn: (row) => Number(row.descuento_total),
      cell: ({ getValue }) => <span className="text-destructive">Q{Number(getValue()).toFixed(2)}</span>,
    },
    { accessorKey: 'total_neto', header: 'Total Neto', cell: ({ row }) => <span className="font-semibold">Q{Number(row.original.total_neto).toFixed(2)}</span> },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => row.original.articulos.length > 0,
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
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.column.id === 'expander' ? 32 : undefined }}>
                  <div className="space-y-0.5">
                    {header.column.id !== 'expander' && (
                      <button
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
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
                        className="h-7 rounded-none border-0 border-b border-transparent px-0 text-xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0"
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
                <TableRow className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow className="bg-muted/15">
                    <TableCell colSpan={columns.length} className="p-0">
                      <div className="border-t border-border/30 px-6 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Artículos vendidos por {row.original.nombre}
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-border/50">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-border/30 bg-muted/20">
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Artículo</th>
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ancho</th>
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidades</th>
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Bruto</th>
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descuento</th>
                                <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Neto</th>

                              </tr>
                            </thead>
                            <tbody>
                              {row.original.articulos.map((a, ai) => (
                                <tr key={`${a.id_variante}-${a.id_talla}`} className={ai % 2 === 0 ? 'bg-card' : 'bg-muted/10'}>
                                  <td className="px-2 py-1 text-xs">{a.articulo}</td>
                                  <td className="px-2 py-1 text-xs">{a.talla}</td>
                                  <td className="px-2 py-1 text-xs">{a.unidades}</td>
                                  <td className="px-2 py-1 text-xs font-semibold">Q{(a.total_bruto ?? 0).toFixed(2)}</td>
                                  <td className="px-2 py-1 text-xs text-destructive">Q{(a.descuento_total ?? 0).toFixed(2)}</td>
                                  <td className="px-2 py-1 text-xs font-semibold">Q{(a.total_neto ?? 0).toFixed(2)}</td>
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

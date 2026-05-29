import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, SearchX } from 'lucide-react'
import type { ReporteVentas } from '../types/reportes'

type Row = ReporteVentas['data']['por_vendedor'][number]

type Props = {
  data: Row[]
  isLoading: boolean
}

export default function PorVendedorTable({ data, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: 'nombre', header: 'Vendedor' },
    { accessorKey: 'cantidad_ventas', header: 'Cant. ventas' },
    { accessorKey: 'unidades', header: 'Unidades' },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-semibold">Q{Number(row.original.total).toFixed(2)}</span> },
  ], [])

  const uniqueNombres = useMemo(() => [...new Set(data.map((r) => r.nombre))], [data])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const hasFilters = columnFilters.length > 0

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 bg-gradient-to-b from-muted/10 to-white px-5 py-2.5">
        <Select
          value={(columnFilters.find((f) => f.id === 'nombre')?.value as string) ?? ''}
          onChange={(e) => {
            setColumnFilters((prev) => {
              const rest = prev.filter((f) => f.id !== 'nombre')
              return e.target.value ? [...rest, { id: 'nombre', value: e.target.value }] : rest
            })
          }}
          className="h-8 w-48 rounded-lg border border-input bg-white px-3 text-xs shadow-sm hover:border-primary/40 focus-visible:border-primary transition-colors cursor-pointer"
        >
          <option value="">Todos los vendedores</option>
          {uniqueNombres.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
        {hasFilters && (
          <button
            onClick={() => setColumnFilters([])}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
              <TableRow key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
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
  )
}

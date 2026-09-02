'use no memo';
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, SearchX } from 'lucide-react'

import TablePagination from '@/components/shared/table/TablePagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/helpers/money'
import { getStockTextClass } from '@/lib/stock-status'
import type { ResumenFilaExistencias, ResumenTotales } from '../types/inventario'

type Props = {
  data: ResumenFilaExistencias[]
  totales?: ResumenTotales
  isLoading: boolean
  /** Rotula que "Vendido" cuenta sólo las compras del cliente filtrado. */
  filtradoPorCliente?: boolean
}

export default function ResumenExistenciasTable({
  data,
  totales,
  isLoading,
  filtradoPorCliente,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<ResumenFilaExistencias>[] = [
    { accessorKey: 'sucursal', header: 'Sucursal' },
    { accessorKey: 'articulo', header: 'Artículo' },
    { accessorKey: 'talla', header: 'Talla' },
    {
      accessorKey: 'habia',
      header: 'Había',
      cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.habia)}</span>,
    },
    {
      accessorKey: 'entradas',
      header: 'Entradas',
      cell: ({ row }) => (
        <span className="tabular-nums text-successful">
          {row.original.entradas > 0 ? `+${formatNumber(row.original.entradas)}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'salidas',
      header: 'Salidas',
      cell: ({ row }) => (
        <span className="tabular-nums text-destructive">
          {row.original.salidas > 0 ? `-${formatNumber(row.original.salidas)}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'vendido',
      header: 'Vendido',
      cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.vendido)}</span>,
    },
    {
      accessorKey: 'hay',
      header: 'Hay',
      cell: ({ row }) => (
        <span className={`font-semibold tabular-nums ${getStockTextClass(row.original.hay)}`}>
          {formatNumber(row.original.hay)}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin existencias"
        description="No hay variantes que coincidan con los filtros seleccionados."
      />
    )
  }

  const numericas = new Set(['habia', 'entradas', 'salidas', 'vendido', 'hay'])

  return (
    <>
      {filtradoPorCliente && (
        <p className="mb-2 text-xs text-muted-foreground">
          Con filtro de cliente, <strong>Vendido</strong> cuenta sólo las unidades que ese cliente
          compró. <strong>Había</strong> y <strong>Hay</strong> siguen siendo las existencias del vendedor.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={numericas.has(header.column.id) ? 'text-right' : ''}
                  >
                    <div className="space-y-0.5">
                      <button
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                        onClick={() => header.column.toggleSorting()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3 opacity-40" />
                      </button>
                      {!numericas.has(header.column.id) && (
                        <Input
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                          placeholder="Filtrar..."
                          className="hidden h-7 rounded-none border-0 border-b border-transparent px-0 text-xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0 md:block"
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row, i) => (
              <TableRow key={row.id} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={numericas.has(cell.column.id) ? 'text-right' : ''}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          {totales && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">TOTAL</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totales.habia)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totales.entradas)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totales.salidas)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totales.vendido)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(totales.hay)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <TablePagination table={table} />
    </>
  )
}

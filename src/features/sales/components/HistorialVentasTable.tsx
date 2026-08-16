'use no memo';
import { useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronRight, ArrowUpDown, SearchX } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import { formatCurrency, formatNumber } from '@/helpers/money'
import type { Venta } from '../types/sales'
import React from 'react'

type Props = {
  data: Venta[]
  isLoading: boolean
  /** Emite las ventas que quedan tras aplicar TODOS los filtros de la tabla (incluye filtros por columna), sin paginar. */
  onFilteredChange?: (ventas: Venta[]) => void
}

export default function HistorialVentasTable({ data, isLoading, onFilteredChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [fotoAbierta, setFotoAbierta] = useState<Venta | null>(null)

  const columns = useMemo<ColumnDef<Venta>[]>(() => [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) =>
        row.getCanExpand() ? (
            <Button
              aria-label={row.getIsExpanded() ? 'Ocultar detalle de venta' : 'Ver detalle de venta'}
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
    {
      accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => {
        const d = new Date(row.original.fecha)
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
    },
    {
      id: 'total_sin_descuento',
      header: 'Total Bruto',
      accessorFn: (row) => Number(row.total),
      cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(Number(getValue()))}</span>,
    },
    { accessorKey: 'total_neto', header: 'Total Neto', cell: ({ row }) => <span className="font-semibold">{formatCurrency(Number(row.original.total_neto))}</span> },
    {
      accessorKey: 'total_descuento',
      header: 'Desc.',
      cell: ({ row }) => row.original.total_descuento > 0
        ? <span className="text-successful">-{formatCurrency(Number(row.original.total_descuento))}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    { accessorKey: 'abonado', header: 'Abonado', cell: ({ row }) => row.original.abonado > 0 ? <span className="text-warning">{formatCurrency(Number(row.original.abonado))}</span> : <span className="text-muted-foreground">—</span> },
    { accessorKey: 'saldo', header: 'Saldo', cell: ({ row }) => row.original.saldo > 0 ? <span className="text-destructive">{formatCurrency(Number(row.original.saldo))}</span> : <span className="text-muted-foreground">—</span> },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado
        const variant = estado === 'PAGADA' ? 'default' as const : estado === 'CANCELADA' ? 'destructive' as const : 'secondary' as const
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
    { accessorKey: 'observacion', header: 'Observación', cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span> },
    {
      id: 'foto',
      header: 'Foto',
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.foto_url
        // Sin foto = venta anterior a la función, o su foto ya fue purgada
        // por el tope global de fotos que conserva el sistema.
        if (!url) return <span className="text-muted-foreground">—</span>
        return (
          <button
            type="button"
            aria-label={`Ver foto de la venta ${row.original.id}`}
            onClick={(e) => { e.stopPropagation(); setFotoAbierta(row.original) }}
            className="block size-10 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
          >
            <img src={url} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        )
      },
    },
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    getRowCanExpand: () => true,
  })

  // Reporta al padre las ventas visibles tras todos los filtros (pre-paginación).
  // Se keyea sobre la lista de IDs para no re-disparar en cada render.
  const filteredRows = table.getFilteredRowModel().rows
  const filteredIdsKey = filteredRows.map((r) => r.original.id).join(',')
  useEffect(() => {
    onFilteredChange?.(filteredRows.map((r) => r.original))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredIdsKey])

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 rounded-lg " />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
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
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                          onClick={() => header.column.toggleSorting()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="size-3 opacity-40" />
                        </button>
                        <Input
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                          placeholder="Filtrar..."
                          className="hidden h-7 rounded-none border-0 border-b border-transparent px-0 text-xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0 md:block"
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
                <React.Fragment key={row.id}>
                  <TableRow className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow key={`${row.id}-detail`}>
                      <TableCell colSpan={columns.length} className="bg-gradient-to-br from-muted/30 to-card p-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalle de la venta</p>
                          <div className="overflow-x-auto rounded-lg border border-border bg-card">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border bg-muted/20">
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Artículo</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ancho</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cantidad</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stock restante</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Precio Bruto</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Desc. Unidad</th>
                                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tipo</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total Bruto</th>
                                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total Neto</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Observación</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.original.detalles.map((d) => {
                                  const cant = d.cantidad || 1
                                  const totalBrutoU = Number(d.total) / cant
                                  const descU = Number(d.descuento)
                                  const tipo = d.tipo_descuento ?? 'NINGUNO'
                                  return (
                                  <tr key={d.id} className="border-b border-border/50 last:border-0">
                                    <td className="px-3 py-2">{d.articulo}</td>
                                    <td className="px-3 py-2">{d.talla}</td>
                                    <td className="px-3 py-2 text-right">{formatNumber(d.cantidad)}</td>
                                    <td className="px-3 py-2 text-right">{d.stock_restante != null ? formatNumber(d.stock_restante) : <span className="text-muted-foreground">—</span>}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totalBrutoU)}</td>
                                    <td className="px-3 py-2 text-right text-destructive">{formatCurrency(descU)}</td>
                                    <td className="px-3 py-2 text-center">
                                      {tipo !== 'NINGUNO' ? (
                                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${tipo === 'INDIVIDUAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {tipo === 'INDIVIDUAL' ? 'Individual' : 'Mayorista'}
                                        </span>
                                      ) : <span className="text-muted-foreground text-xs">—</span>}
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(d.total))}</td>
                                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(d.total_neto))}</td>
                                    <td className="px-3 py-2">{row.original.observacion || <span className="text-muted-foreground">—</span>}</td>
                                  </tr>
                                  )
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-border bg-muted/30">
                                  <td className="px-3 py-2 font-semibold text-xs" colSpan={7}>Total</td>
                                  <td className="px-3 py-2 text-right font-semibold text-xs">
                                    {formatCurrency(row.original.detalles.reduce((s, d) => s + Number(d.total), 0))}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-xs">
                                    {formatCurrency(row.original.detalles.reduce((s, d) => s + Number(d.total_neto), 0))}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} />

      <Dialog open={fotoAbierta !== null} onOpenChange={(open) => { if (!open) setFotoAbierta(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto de entrega · Venta #{fotoAbierta?.id}</DialogTitle>
            <DialogDescription>
              {fotoAbierta?.cliente_info.nombre_completo} · {fotoAbierta?.vendedor.full_name}
            </DialogDescription>
          </DialogHeader>
          {fotoAbierta?.foto_url && (
            <div className="px-6 pb-6">
              <img
                src={fotoAbierta.foto_url}
                alt={`Entrega de la venta ${fotoAbierta.id}`}
                className="max-h-[65vh] w-full rounded-lg border border-border object-contain"
              />
              <a
                href={fotoAbierta.foto_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Abrir en tamaño completo
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

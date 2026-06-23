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
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Abono, ComprasData } from '../types/clientes'

type MovimientoBase = {
  fecha: string
  idMovimiento: number
  idVenta: number
  totalVenta: number
  abonado: number
  saldo: number
  estado: string
  formaPago: string | null
  responsable: string | null
  observacion: string | null
}

type MovimientoCompra = MovimientoBase & {
  tipo: 'Compra'
  compra: Venta
}

type MovimientoAbono = MovimientoBase & {
  tipo: 'Abono'
  abono: Abono
}

type Movimiento = MovimientoCompra | MovimientoAbono

type Props = {
  ventas: Venta[]
  abonos: Abono[]
  resumen?: ComprasData['resumen']
}

const formatCurrency = (value: number) => `Q${Number(value).toFixed(2)}`

const formatDate = (value: string) => {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export default function MovimientosTable({ ventas, abonos, resumen }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const movimientos = useMemo<Movimiento[]>(() => [
    ...ventas.map<MovimientoCompra>((venta) => ({
      tipo: 'Compra',
      fecha: venta.fecha,
      idMovimiento: venta.id,
      idVenta: venta.id,
      totalVenta: Number(venta.total),
      abonado: Number(venta.abonado),
      saldo: Number(venta.saldo),
      estado: venta.estado,
      formaPago: venta.forma_pago,
      responsable: venta.vendedor.full_name,
      observacion: venta.observacion ?? null,
      compra: venta,
    })),
    ...abonos.map<MovimientoAbono>((abono) => ({
      tipo: 'Abono',
      fecha: abono.fecha_abono,
      idMovimiento: abono.id,
      idVenta: abono.id_venta,
      totalVenta: Number(abono.venta_total),
      abonado: Number(abono.monto),
      saldo: Number(abono.saldo_restante),
      estado: abono.venta_estado,
      formaPago: null,
      responsable: abono.usuario?.full_name || abono.usuario?.username || null,
      observacion: abono.observacion ?? null,
      abono,
    })),
  ], [ventas, abonos])

  const columns = useMemo<ColumnDef<Movimiento>[]>(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      sortingFn: 'datetime',
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.fecha)}</span>,
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.tipo === 'Compra' ? 'secondary' : 'default'}>
          {row.original.tipo}
        </Badge>
      ),
    },
    {
      accessorKey: 'idMovimiento',
      header: 'ID movimiento',
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono text-xs">
          {row.original.tipo} #{row.original.idMovimiento}
        </span>
      ),
    },
    {
      accessorKey: 'idVenta',
      header: 'Venta relacionada',
      cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs">Venta #{row.original.idVenta}</span>,
    },
    {
      accessorKey: 'totalVenta',
      header: 'Total venta',
      cell: ({ row }) => <span className="whitespace-nowrap font-semibold">{formatCurrency(row.original.totalVenta)}</span>,
    },
    {
      accessorKey: 'abonado',
      header: 'Abonado',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-warning">{formatCurrency(row.original.abonado)}</p>
          <p className="text-[10px] text-muted-foreground">
            {row.original.tipo === 'Compra' ? 'Acumulado' : 'Este abono'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      cell: ({ row }) => <span className="whitespace-nowrap text-destructive">{formatCurrency(row.original.saldo)}</span>,
    },
    { accessorKey: 'estado', header: 'Estado venta' },
    {
      accessorKey: 'formaPago',
      header: 'Forma de pago',
      cell: ({ row }) => row.original.formaPago
        ? <span className="capitalize">{row.original.formaPago}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'responsable',
      header: 'Responsable',
      cell: ({ row }) => row.original.responsable || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'observacion',
      header: 'Observación',
      cell: ({ row }) => row.original.observacion || <span className="text-muted-foreground">—</span>,
    },
  ], [])

  const table = useReactTable({
    data: movimientos,
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

  const visibleRows = table.getRowModel().rows
  const hasFilters = columnFilters.length > 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Movimientos generales</h3>
        <p className="text-sm text-muted-foreground">Compras y abonos ordenados del más reciente al más antiguo.</p>
      </div>

      {resumen && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total ventas</p>
            <p className="text-xl font-bold">{resumen.total_ventas}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total general</p>
            <p className="text-xl font-bold text-primary">Q{Number(resumen.total_general).toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="text-xl font-bold text-successful">Q{Number(resumen.total_pagado).toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Abonado</p>
            <p className="text-xl font-bold text-warning">Q{Number(resumen.total_abonado).toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Balance (deuda)</p>
            <p className="text-xl font-bold text-destructive">Q{Number(resumen.balance).toFixed(2)}</p>
          </div>
        </div>
      )}

      {movimientos.length === 0 ? (
        <EmptyState icon={Receipt} size="sm" title="No hay movimientos registrados." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain">
              <Table className="min-w-[1250px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              className="flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider"
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
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                        Sin resultados para la búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row) => (
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
                {table.getFilteredRowModel().rows.length} de {movimientos.length} resultados
              </div>
            )}
          </div>

          <TablePagination table={table} />
        </>
      )}
    </div>
  )
}

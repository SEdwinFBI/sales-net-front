'use no memo';
import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router'
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, SearchX, ChevronRight, ChevronDown, Eye, FileDown } from 'lucide-react'
import TablePagination from '@/components/shared/table/TablePagination'
import type { ReporteCobrosUsuario, ReporteCobrosFilters, ReporteCobroCliente } from '../types/reportes'

type Row = ReporteCobrosUsuario

type Props = {
  data: Row[]
  isLoading: boolean
  onDownloadUserPdf: (filters: ReporteCobrosFilters) => void
  pdfUserLoading?: number | null
  fecha?: string
}

function formatCurrency(value: number) {
  return `Q${Number(value ?? 0).toFixed(2)}`
}

function getDebtValue(row: ReporteCobroCliente) {
  return Number(row.balance ?? row.saldo_restante ?? 0)
}

function getClienteRows(row: ReporteCobrosUsuario): ReporteCobroCliente[] {
  if (row.clientes) return row.clientes

  const grouped = new Map<number, ReporteCobroCliente & { ventaIds: Set<number> }>()

  for (const cobro of row.cobros ?? []) {
    const current = grouped.get(cobro.cliente.id)
    if (current) {
      current.total_cobrado += Number(cobro.monto ?? 0)
      current.saldo_restante = Number(current.saldo_restante ?? 0) + Number(cobro.saldo_restante ?? 0)
      current.balance = cobro.cliente.balance ?? current.balance
      current.cantidad_cobros = Number(current.cantidad_cobros ?? 0) + 1
      current.ventaIds.add(cobro.id_venta)
      current.ventas_afectadas = current.ventaIds.size
      continue
    }

    grouped.set(cobro.cliente.id, {
      id_cliente: cobro.cliente.id,
      nombre_completo: cobro.cliente.nombre_completo,
      total_cobrado: Number(cobro.monto ?? 0),
      saldo_restante: Number(cobro.saldo_restante ?? 0),
      balance: cobro.cliente.balance,
      cantidad_cobros: 1,
      ventas_afectadas: 1,
      ventaIds: new Set([cobro.id_venta]),
    })
  }

  return [...grouped.values()].map((cliente) => ({
    id_cliente: cliente.id_cliente,
    nombre_completo: cliente.nombre_completo,
    total_cobrado: cliente.total_cobrado,
    saldo_restante: cliente.saldo_restante,
    balance: cliente.balance,
    cantidad_cobros: cliente.cantidad_cobros,
    ventas_afectadas: cliente.ventas_afectadas,
  }))
}

export default function CobrosPorUsuarioTable({ data, isLoading, onDownloadUserPdf, pdfUserLoading, fecha }: Props) {
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
          aria-label={row.getIsExpanded() ? 'Ocultar cobros del usuario' : 'Ver cobros del usuario'}
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
    { accessorKey: 'nombre', header: 'Usuario' },
    { accessorKey: 'cantidad_cobros', header: 'Cant. cobros' },
    {
      id: 'total_abonado',
      header: 'Total abonado',
      accessorFn: (row) => Number(row.total_abonado),
      cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(Number(getValue()))}</span>,
    },
    {
      id: 'total_restante',
      header: 'Total restante',
      accessorFn: (row) => Number(row.total_restante),
      cell: ({ getValue }) => <span className="font-semibold text-primary">{formatCurrency(Number(getValue()))}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const idUsuario = row.original.id_usuario
        return (
          <Button
            size="sm"
            variant="ghost"
            disabled={!idUsuario || pdfUserLoading === idUsuario}
            onClick={() => {
              if (!idUsuario) return
              onDownloadUserPdf({ id_usuario: idUsuario, fecha })
            }}
            aria-label={`Descargar reporte de ${row.original.nombre}`}
          >
            <FileDown />
            {pdfUserLoading === idUsuario ? 'Descargando...' : 'PDF'}
          </Button>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [fecha, onDownloadUserPdf, pdfUserLoading])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => getClienteRows(row.original).length > 0,
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
                      {header.column.id !== 'expander' && header.column.id !== 'actions' && (
                        <button
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                          onClick={() => header.column.toggleSorting()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="size-3 opacity-40" />
                        </button>
                      )}
                      {header.column.id !== 'expander' && header.column.id !== 'actions' && (
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
                            Cobros realizados por {row.original.nombre}
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-border/50">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-border/30 bg-muted/20">
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobrado</th>
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Debe</th>
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobros</th>
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ventas</th>
                                  <th className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {getClienteRows(row.original).map((cliente, ci) => (
                                  <tr key={cliente.id_cliente} className={ci % 2 === 0 ? 'bg-card' : 'bg-muted/10'}>
                                    <td className="px-2 py-1 text-xs">{cliente.nombre_completo}</td>
                                    <td className="px-2 py-1 text-xs font-semibold">{formatCurrency(cliente.total_cobrado)}</td>
                                    <td className="px-2 py-1 text-xs font-semibold text-primary">{formatCurrency(getDebtValue(cliente))}</td>
                                    <td className="px-2 py-1 text-xs">{cliente.cantidad_cobros ?? 1}</td>
                                    <td className="px-2 py-1 text-xs">{cliente.ventas_afectadas ?? 1}</td>
                                    <td className="px-2 py-1 text-xs">
                                      <Link to={`/clientes/listado/${cliente.id_cliente}`}>
                                        <Button size="icon-xs" variant="ghost" aria-label={`Ver detalle de ${cliente.nombre_completo}`}>
                                          <Eye className="size-3.5" />
                                        </Button>
                                      </Link>
                                    </td>
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

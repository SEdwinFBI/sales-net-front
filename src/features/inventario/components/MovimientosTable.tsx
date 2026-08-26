'use no memo';
import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  PackagePlus,
  SearchX,
  Settings2,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/helpers/money'
import { formatDisplayDateTime } from '@/lib/dates'
import type { Movimiento, TipoMovimiento } from '../types/inventario'

type Props = {
  movimientos: Movimiento[]
  isLoading: boolean
  /** Oculta la columna de vendedor cuando ya está agrupado por él. */
  ocultarVendedor?: boolean
}

/** Icono y color por tipo, para leer la tabla de un vistazo. */
const TIPO_CONFIG: Record<TipoMovimiento, { icon: LucideIcon; className: string }> = {
  STOCK_VENTA: { icon: ShoppingCart, className: 'text-destructive' },
  STOCK_RESURTIDO: { icon: PackagePlus, className: 'text-successful' },
  STOCK_AJUSTE: { icon: Settings2, className: 'text-warning' },
  STOCK_CARGA_INICIAL: { icon: PackagePlus, className: 'text-primary' },
  SALDO_VENTA_CREDITO: { icon: Wallet, className: 'text-destructive' },
  SALDO_ABONO: { icon: Wallet, className: 'text-successful' },
  SALDO_CANCELACION: { icon: Wallet, className: 'text-muted-foreground' },
  SALDO_INICIAL: { icon: Wallet, className: 'text-primary' },
  SALDO_AJUSTE: { icon: Settings2, className: 'text-warning' },
}

function formatearFecha(iso: string) {
  return formatDisplayDateTime(iso)
}

/** Entero con signo explícito: el signo es la información principal. */
function conSigno(valor: number) {
  return `${valor > 0 ? '+' : ''}${formatNumber(valor)}`
}

const nombreRegistro = (m: Movimiento) => m.usuario_registra?.full_name || m.usuario_registra?.username || ''

export default function MovimientosTable({ movimientos, isLoading, ocultarVendedor }: Props) {
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const alternar = (id: number) =>
    setExpandidos((previo) => ({ ...previo, [id]: !previo[id] }))

  const columns = useMemo<ColumnDef<Movimiento>[]>(() => {
    const cols: ColumnDef<Movimiento>[] = [
      {
        id: 'expand',
        header: '',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const abierto = Boolean(expandidos[row.original.id])
          return (
            <Button
              aria-label={abierto ? 'Ocultar líneas del movimiento' : 'Ver líneas del movimiento'}
              size="icon-xs"
              variant="ghost"
              className="size-6"
              onClick={() => alternar(row.original.id)}
            >
              {abierto ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Button>
          )
        },
      },
      {
        accessorKey: 'id',
        header: 'No. Movimiento',
        enableColumnFilter: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        enableColumnFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatearFecha(row.original.fecha)}</span>,
      },
      {
        id: 'tipo',
        accessorFn: (m) => m.tipo_display,
        header: 'Tipo',
        cell: ({ row }) => {
          const config = TIPO_CONFIG[row.original.tipo]
          const Icono = config?.icon ?? Settings2
          return (
            <span className="flex items-center gap-1.5">
              <Icono className={`size-4 shrink-0 ${config?.className ?? ''}`} />
              <span className="text-sm">{row.original.tipo_display}</span>
            </span>
          )
        },
      },
    ]

    if (!ocultarVendedor) {
      cols.push({
        id: 'sucursal',
        accessorFn: (m) => m.sucursal_afectada?.nombre ?? '',
        header: 'Sucursal',
        cell: ({ row }) => (
          row.original.sucursal_afectada?.nombre
            || <span className="text-muted-foreground">—</span>
        ),
      })
    }

    cols.push(
      {
        accessorKey: 'total_unidades',
        header: 'Unidades',
        enableColumnFilter: false,
        cell: ({ row }) => (
          <span className={`font-semibold ${row.original.total_unidades >= 0 ? 'text-successful' : 'text-destructive'}`}>
            {conSigno(row.original.total_unidades)}
          </span>
        ),
      },
      {
        id: 'venta',
        accessorFn: (m) => m.id_venta ?? '',
        header: 'Venta',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          row.original.id_venta
            ? <span className="font-mono text-xs">#{row.original.id_venta}</span>
            : <span className="text-muted-foreground">—</span>
        ),
      },
      {
        id: 'registro',
        accessorFn: nombreRegistro,
        header: 'Registró',
        cell: ({ row }) => (
          nombreRegistro(row.original) || <span className="text-muted-foreground">—</span>
        ),
      },
      {
        accessorKey: 'observacion',
        header: 'Detalle',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.observacion || '—'}</span>
        ),
      },
    )

    return cols
  }, [expandidos, ocultarVendedor])

  const table = useReactTable({
    data: movimientos,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    )
  }

  if (movimientos.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin movimientos"
        description="No hay movimientos que coincidan con los filtros seleccionados."
      />
    )
  }

  const filasFiltradas = table.getFilteredRowModel().rows

  return (
    <div className="space-y-2">
      {filasFiltradas.length !== movimientos.length && (
        <p className="text-xs text-muted-foreground">
          {filasFiltradas.length} de {movimientos.length} movimientos de esta página
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
                    className={header.column.id === 'total_unidades' ? 'text-right' : ''}
                  >
                    <div className="space-y-0.5">
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                          onClick={() => header.column.toggleSorting()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="size-3 opacity-40" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                      {header.column.getCanFilter() && (
                        <Input
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                          placeholder="Filtrar..."
                          className="hidden h-7 rounded-none border-0 border-b border-transparent px-0 text-[11px] placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-0 md:block"
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                  Ningún movimiento coincide con los filtros de la tabla.
                </TableCell>
              </TableRow>
            ) : (
              filasFiltradas.map((row, i) => {
                const movimiento = row.original
                const abierto = Boolean(expandidos[movimiento.id])

                return (
                  <React.Fragment key={row.id}>
                    <TableRow className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cell.column.id === 'total_unidades' ? 'text-right' : ''}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>

                    {abierto && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-gradient-to-br from-muted/30 to-card p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Líneas del movimiento
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-border bg-card">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border bg-muted/20">
                                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Artículo</th>
                                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Talla</th>
                                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Había</th>
                                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Movimiento</th>
                                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Quedó</th>
                                </tr>
                              </thead>
                              <tbody>
                                {movimiento.detalles.map((detalle) => (
                                  <tr key={detalle.id} className="border-b border-border/50 last:border-0">
                                    <td className="px-3 py-2">{detalle.articulo ?? '—'}</td>
                                    <td className="px-3 py-2">{detalle.talla ?? '—'}</td>
                                    <td className="px-3 py-2 text-right">{formatNumber(detalle.cantidad_anterior)}</td>
                                    <td
                                      className={`px-3 py-2 text-right font-semibold ${detalle.cantidad >= 0 ? 'text-successful' : 'text-destructive'}`}
                                    >
                                      {conSigno(detalle.cantidad)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">
                                      {formatNumber(detalle.cantidad_resultante)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useAuthStore } from '@/features/core/store/auth-store'
import {
  usePreciosCliente,
  useDeletePrecioCliente,
} from '../hooks/usePreciosCliente'
import { useCustomerPricesStore } from '../store/useCustomerPricesStore'
import type { ClienteVariantePrecioResponse } from '../types/customer-prices'
import { formatCurrency } from '@/helpers/money'
import { formatDisplayDate } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TablePagination from '@/components/shared/table/TablePagination'
import EditCustomerPriceDialog from './EditCustomerPriceDialog'
import {
  Trash2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  customerId: number
  customerName?: string
}

type TabFilter = 'todos' | 'configurados' | 'sin_configurar'

export default function PreciosClienteTable({
  customerId,
  customerName = 'Cliente',
}: Props) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const { data: variants = [], isLoading, isError, refetch } = usePreciosCliente(customerId)
  const deleteMutation = useDeletePrecioCliente(customerId)
  const removeLocalPrice = useCustomerPricesStore((state) => state.removePrice)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [tabFilter, setTabFilter] = useState<TabFilter>('todos')
  const [activeItem, setActiveItem] = useState<ClienteVariantePrecioResponse | null>(null)

  // Conteos para los botones de pestañas
  const counts = useMemo(() => {
    const configurados = variants.filter((v) => v.tiene_config).length
    const sinConfigurar = variants.length - configurados
    return {
      todos: variants.length,
      configurados,
      sinConfigurar,
    }
  }, [variants])

  const handleDelete = async (variant: ClienteVariantePrecioResponse) => {
    if (!isAdmin) {
      toast.error('Solo un administrador puede eliminar precios del cliente.')
      return
    }

    try {
      await deleteMutation.mutateAsync(variant.id_variante)
      removeLocalPrice(customerId, variant.id_variante)
    } catch {
      // Error handled by hook
    }
  }

  const columns = useMemo<ColumnDef<ClienteVariantePrecioResponse>[]>(() => {
    const cols: ColumnDef<ClienteVariantePrecioResponse>[] = [
      {
        id: 'articulo',
        accessorFn: (row) => row.articulo,
        header: 'Artículo',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[170px]">
            <span className="font-medium text-foreground leading-tight">{row.original.articulo}</span>
            {row.original.sku && (
              <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                SKU: {row.original.sku}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'talla',
        accessorFn: (row) => row.talla,
        header: 'Talla',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-medium">
            {row.original.talla}
          </Badge>
        ),
      },
      {
        id: 'precio_base',
        accessorKey: 'precio_base',
        header: 'Precio de catálogo',
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-right block">
            {formatCurrency(row.original.precio_base)}
          </span>
        ),
      },
      {
        id: 'precio_cliente',
        accessorFn: (row) =>
          row.tiene_config && row.precio_cliente !== null ? row.precio_cliente : row.precio_base,
        header: 'Precio del cliente',
        cell: ({ row }) => {
          const v = row.original
          return (
            <div className="text-right tabular-nums">
              {v.tiene_config && v.precio_cliente !== null ? (
                <span className="font-bold text-primary text-base">
                  {formatCurrency(v.precio_cliente)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  {formatCurrency(v.precio_base)}
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: 'ahorro',
        accessorKey: 'ahorro',
        header: 'Diferencia',
        cell: ({ row }) => {
          const v = row.original
          if (v.tiene_config && v.ahorro > 0) {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold"
                >
                  −{formatCurrency(v.ahorro)}
                </Badge>
              </div>
            )
          }
          if (v.tiene_config && v.precio_cliente !== null && v.precio_cliente > v.precio_base) {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold"
                >
                  +{formatCurrency(v.precio_cliente - v.precio_base)}
                </Badge>
              </div>
            )
          }
          return <span className="text-xs text-muted-foreground block text-center">—</span>
        },
      },
      {
        id: 'tiene_config',
        accessorKey: 'tiene_config',
        header: 'Estado',
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === undefined || filterValue === null) return true
          return row.getValue(columnId) === filterValue
        },
        cell: ({ row }) => {
          const v = row.original
          return (
            <div className="flex justify-center">
              {v.tiene_config ? (
                <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-medium gap-1">
                  <Sparkles className="size-3" />
                  Personalizado
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                  Catálogo
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: 'fecha_actualizacion',
        accessorKey: 'fecha_actualizacion',
        header: 'Actualizado',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {row.original.fecha_actualizacion ? formatDisplayDate(row.original.fecha_actualizacion) : '—'}
          </span>
        ),
      },
    ]

    if (isAdmin) {
      cols.push({
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const v = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              {v.tiene_config ? (
                <>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setActiveItem(v)}
                    title="Editar precio del cliente"
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => handleDelete(v)}
                    disabled={deleteMutation.isPending}
                    title="Eliminar precio del cliente y usar el de catálogo"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveItem(v)}
                  className="gap-1 text-xs cursor-pointer hover:border-primary hover:text-primary"
                >
                  <Plus className="size-3" />
                  Asignar
                </Button>
              )}
            </div>
          )
        },
      })
    }

    return cols
  }, [isAdmin, deleteMutation.isPending])

  const table = useReactTable({
    data: variants,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const q = String(filterValue || '').toLowerCase().trim()
      if (!q) return true
      const articulo = (row.original.articulo ?? '').toLowerCase()
      const talla = (row.original.talla ?? '').toLowerCase()
      const sku = (row.original.sku ?? '').toLowerCase()
      return articulo.includes(q) || talla.includes(q) || sku.includes(q)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const handleTabChange = (nextTab: TabFilter) => {
    setTabFilter(nextTab)
    if (nextTab === 'configurados') {
      table.getColumn('tiene_config')?.setFilterValue(true)
    } else if (nextTab === 'sin_configurar') {
      table.getColumn('tiene_config')?.setFilterValue(false)
    } else {
      table.getColumn('tiene_config')?.setFilterValue(undefined)
    }
  }

  const renderSortIcon = (column: any) => {
    const isSorted = column.getIsSorted()
    if (isSorted === 'asc') return <ArrowUp className="size-3 text-primary shrink-0" />
    if (isSorted === 'desc') return <ArrowDown className="size-3 text-primary shrink-0" />
    return <ArrowUpDown className="size-3 opacity-40 shrink-0 hover:opacity-100" />
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Cargando precios...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-medium text-destructive">
          No se pudieron cargar los precios del cliente.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          Reintentar
        </Button>
      </div>
    )
  }

  const hasActiveFilters = Boolean(globalFilter || columnFilters.length > 0 || tabFilter !== 'todos')

  return (
    <div className="space-y-3.5">
      {/* Barra superior con filtros, tabs y badges de permisos */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs de filtro */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleTabChange('todos')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                tabFilter === 'todos'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({counts.todos})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('configurados')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                tabFilter === 'configurados'
                  ? 'bg-background text-primary shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="size-3 text-primary" />
              Personalizados ({counts.configurados})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('sin_configurar')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                tabFilter === 'sin_configurar'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              De catálogo ({counts.sinConfigurar})
            </button>
          </div>

          <div className="relative min-w-[220px] sm:max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por artículo, talla o SKU..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-primary text-xs gap-1 py-1"
            >
              <ShieldCheck className="size-3.5" />
              Puedes editar precios
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1 py-1 text-muted-foreground">
              <ShieldAlert className="size-3.5" />
              Solo consulta
            </Badge>
          )}
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card">
          <EmptyState
            icon={Layers}
            size="sm"
            title="No hay artículos disponibles"
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const canFilter = header.column.getCanFilter()
                      const isAcciones = header.column.id === 'acciones'
                      const isStateColumn = header.column.id === 'tiene_config'
                      return (
                        <TableHead key={header.id} className="py-2.5">
                          <div className={`space-y-1 ${isAcciones ? 'text-right' : ''}`}>
                            {canSort ? (
                              <button
                                type="button"
                                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                onClick={() => header.column.toggleSorting()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {renderSortIcon(header.column)}
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                            )}

                            {canFilter && !isStateColumn && !isAcciones && (
                              <Input
                                value={(header.column.getFilterValue() ?? '') as string}
                                onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                                placeholder="Filtrar..."
                                className="h-6 rounded border border-border/50 bg-background/50 px-1.5 text-[11px] placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary"
                              />
                            )}
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center text-xs text-muted-foreground">
                      No hay artículos que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        row.original.tiene_config ? 'bg-primary/[0.02]' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasActiveFilters && (
            <div className="border-t border-border/50 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Mostrando {table.getFilteredRowModel().rows.length} de {variants.length} variantes
              </span>
              <button
                type="button"
                onClick={() => {
                  setGlobalFilter('')
                  setColumnFilters([])
                  handleTabChange('todos')
                }}
                className="text-primary hover:underline font-medium text-xs cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paginación nativa TanStack Table */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <TablePagination table={table} />
      )}

      {/* Modal de edición / asignación de precio pactado para Admin */}
      <EditCustomerPriceDialog
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        customerId={customerId}
        customerName={customerName}
        variantItem={activeItem}
        onSuccess={() => setActiveItem(null)}
      />
    </div>
  )
}

'use no memo';
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, X, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import type { Usuario } from '../types/usuario-types'
import UsuarioDialog from './UsuarioDialog'
import DeleteUsuarioDialog from './DeleteUsuarioDialog'

type Props = {
  data: Usuario[]
  isLoading: boolean
}

export default function UsuariosTable({ data, isLoading }: Props) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)

  const columns: ColumnDef<Usuario>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nombre completo',
    },
    {
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === 'admin' ? 'default' : 'secondary'}
          className="px-2.5 py-0.5 font-semibold uppercase tracking-wide"
        >
          {row.original.role ?? 'Sin rol'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Editar ${row.original.fullName || row.original.username}`}
            onClick={() => {
              setSelectedUsuario(row.original)
              setDialogOpen(true)
            }}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            aria-label={`Eliminar ${row.original.fullName || row.original.username}`}
            onClick={() => setUsuarioToDelete(row.original)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const roleFilter = (table.getColumn('role')?.getFilterValue() as string | undefined) ?? 'all'
  const hasActiveFilters = globalFilter.length > 0 || columnFilters.length > 0
  const filteredCount = table.getFilteredRowModel().rows.length

  const clearFilters = () => {
    setGlobalFilter('')
    setColumnFilters([])
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto] lg:min-w-[560px] lg:max-w-3xl">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              aria-label="Filtrar por rol"
              value={roleFilter}
              onChange={(event) =>
                table
                  .getColumn('role')
                  ?.setFilterValue(event.target.value === 'all' ? undefined : event.target.value)
              }
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="vendedor">Vendedor</option>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={cn('w-full sm:w-auto', !hasActiveFilters && 'hidden sm:inline-flex')}
            >
              <X />
              Limpiar
            </Button>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => { setSelectedUsuario(null); setDialogOpen(true) }}
          >
            <Plus />
            Nuevo usuario
          </Button>
        </div>

        {/* Table */}
        <div className="grid gap-3 md:hidden">
          {isLoading ? (
            <EmptyState title="Cargando usuarios…" />
          ) : table.getRowModel().rows.length === 0 ? (
            <EmptyState icon={Users} title="No se encontraron usuarios." />
          ) : (
            table.getRowModel().rows.map((row) => {
              const usuario = row.original

              return (
                <div
                  key={usuario.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-primary">
                        {usuario.fullName || usuario.username}
                      </p>
                      <p className="mt-0.5 break-words text-sm text-muted-foreground">
                        {usuario.username}
                      </p>
                    </div>
                    <Badge
                      variant={usuario.role === 'admin' ? 'default' : 'secondary'}
                      className="shrink-0 px-2.5 py-0.5 font-semibold uppercase tracking-wide"
                    >
                      {usuario.role ?? 'Sin rol'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label={`Editar ${usuario.fullName || usuario.username}`}
                      onClick={() => {
                        setSelectedUsuario(usuario)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar ${usuario.fullName || usuario.username}`}
                      onClick={() => setUsuarioToDelete(usuario)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
          <Table className="min-w-[640px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow key={row.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredCount} de {data.length} usuarios - Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Página anterior"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Página siguiente"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <UsuarioDialog
        open={dialogOpen}
        usuario={selectedUsuario}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteUsuarioDialog
        usuario={usuarioToDelete}
        onClose={() => setUsuarioToDelete(null)}
      />
    </>
  )
}

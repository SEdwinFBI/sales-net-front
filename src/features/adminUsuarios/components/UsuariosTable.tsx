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
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
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
        <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => {
              setSelectedUsuario(row.original)
              setDialogOpen(true)
            }}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="destructive"
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
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto] lg:min-w-[560px] lg:max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
              className="w-full sm:w-auto"
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
        <div className="rounded-2xl border border-border overflow-hidden">
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
                table.getRowModel().rows.map((row) => (
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredCount} de {data.length} usuarios - Pagina {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
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

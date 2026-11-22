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
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, X, Users, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import type { Usuario } from '../types/usuario-types'
import UsuarioDialog from './UsuarioDialog'
import DeleteUsuarioDialog from './DeleteUsuarioDialog'
import PermisosDrawer from './PermisosDrawer'
import { PERMISOS, resumenPermisos, type PermisoDef } from '../permisos'
import { useUpdateUsuario } from '../hooks/useUpdateUsuario'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useSucursales } from '../../branches/hooks/useSucursales'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildUsuariosTools, type UsuarioFormValues } from '../../agent/usuarios-tools'
import { paginationTool, tablePagination } from '@/features/agent/pagination-tools'
import { useBuscarParam } from '@/features/core/quick-search/useBuscarParam'

type Props = {
  data: Usuario[]
  isLoading: boolean
  online: Map<string, number>
}

function presenceLabel(sessions: number) {
  if (sessions <= 0) return 'Desconectado'
  return sessions > 1 ? `En línea · ${sessions} sesiones` : 'En línea'
}

function PresenceDot({ sessions }: { sessions: number }) {
  const isOnline = sessions > 0
  return (
    <span
      className="relative flex size-2 shrink-0"
      title={presenceLabel(sessions)}
    >
      {isOnline && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          'relative inline-flex size-2 rounded-full',
          isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30',
        )}
      />
    </span>
  )
}

export default function UsuariosTable({ data, isLoading, online }: Props) {
  const [globalFilter, setGlobalFilter] = useState('')
  // La busqueda rapida del encabezado abre la lista ya filtrada.
  useBuscarParam(setGlobalFilter)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [dialogInitial, setDialogInitial] = useState<Partial<UsuarioFormValues> | undefined>(undefined)
  const { mutateAsync: updateUsuario, isPending: isUpdating } = useUpdateUsuario()
  const { data: sucursales } = useSucursales()

  // Panel de permisos del telefono: se guarda el id y el usuario sale de la lista, que se refresca al guardar.
  const [permisosId, setPermisosId] = useState<number | null>(null)
  const permisosDe = permisosId === null ? null : data.find((u) => u.id === permisosId) ?? null

  const cambiarPermiso = async (usuario: Usuario, permiso: PermisoDef, enabled: boolean) => {
    try {
      await updateUsuario({ id: usuario.id, [permiso.key]: enabled })
      toast.success(`${permiso.label}: ${enabled ? 'activado' : 'desactivado'}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, `No se pudo actualizar: ${permiso.label.toLowerCase()}`))
    }
  }

  const permisoCheckbox = (usuario: Usuario, permiso: PermisoDef) => {
    const bloqueo = permiso.bloqueo(usuario)
    return (
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={permiso.valor(usuario)}
        disabled={isUpdating || bloqueo !== null}
        title={bloqueo ?? undefined}
        aria-label={`${permiso.label} de ${usuario.fullName || usuario.username}`}
        onChange={(event) => cambiarPermiso(usuario, permiso, event.target.checked)}
      />
    )
  }

  const columns: ColumnDef<Usuario>[] = [
    {
      id: 'presence',
      header: 'Estado',
      cell: ({ row }) => {
        const sessions = online.get(String(row.original.id)) ?? 0
        const isOnline = sessions > 0
        return (
          <span className="inline-flex items-center gap-1.5">
            <PresenceDot sessions={sessions} />
            <span
              className={cn(
                'text-xs font-medium',
                isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            >
              {presenceLabel(sessions)}
            </span>
          </span>
        )
      },
    },
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
    ...PERMISOS.map((permiso): ColumnDef<Usuario> => ({
      id: permiso.key,
      header: permiso.label,
      cell: ({ row }) => permisoCheckbox(row.original, permiso),
    })),
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
              setDialogInitial(undefined)
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

  // Paginación para el agente: leer la página visible y cambiar de página o de tamaño.
  useAgentTools('paginacion-usuarios', [paginationTool('usuarios', 'la tabla de usuarios', tablePagination(table))])

  const roleFilter = (table.getColumn('role')?.getFilterValue() as string | undefined) ?? 'all'
  const hasActiveFilters = globalFilter.length > 0 || columnFilters.length > 0
  const filteredCount = table.getFilteredRowModel().rows.length

  const clearFilters = () => {
    setGlobalFilter('')
    setColumnFilters([])
  }

  // Tools del agente: leen y filtran lo que la tabla ya muestra, abren sus diálogos (el usuario guarda) y
  // cambian los permisos con la misma `updateUsuario` de los checkboxes. Ninguna toca contraseñas.
  useAgentTools(
    'usuarios-table',
    buildUsuariosTools({
      getUsuarios: () => data,
      getFiltered: () => table.getFilteredRowModel().rows.map((row) => row.original),
      getFilters: () => ({
        texto: globalFilter,
        rol: roleFilter === 'admin' || roleFilter === 'vendedor' ? roleFilter : 'todos',
      }),
      setFilters: ({ texto, rol }) => {
        if (texto !== undefined) setGlobalFilter(texto)
        if (rol !== undefined) table.getColumn('role')?.setFilterValue(rol === 'todos' ? undefined : rol)
        table.setPageIndex(0)
      },
      getSucursalIds: () => sucursales?.map((s) => s.id),
      getSucursalOptions: () => sucursales?.map((s) => ({ id: s.id, nombre: s.nombre })),
      isDialogOpen: () => dialogOpen,
      isDeleteOpen: () => usuarioToDelete !== null,
      openNew: (valores) => { setSelectedUsuario(null); setDialogInitial(valores); setDialogOpen(true) },
      openEdit: (usuario, valores) => { setSelectedUsuario(usuario); setDialogInitial(valores); setDialogOpen(true) },
      openDelete: setUsuarioToDelete,
      updatePermisos: async (id, cambios) => {
        try {
          await updateUsuario({ id, ...cambios })
          const [key, enabled] = Object.entries(cambios)[0] ?? []
          const permiso = PERMISOS.find((p) => p.key === key)
          toast.success(permiso ? `${permiso.label}: ${enabled ? 'activado' : 'desactivado'}` : 'Permiso actualizado')
          return true
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'No se pudo actualizar el permiso'))
          return false
        }
      },
      isUpdating: () => isUpdating,
    }),
  )

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/75 bg-muted/35 p-3 lg:flex-row lg:items-center lg:justify-between">
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
            onClick={() => { setSelectedUsuario(null); setDialogInitial(undefined); setDialogOpen(true) }}
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
                      <div className="flex items-center gap-2">
                        <PresenceDot sessions={online.get(String(usuario.id)) ?? 0} />
                        <p className="break-words text-sm font-semibold text-primary">
                          {usuario.fullName || usuario.username}
                        </p>
                      </div>
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

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPermisosId(usuario.id)}>
                      <ShieldCheck />
                      Permisos
                      <span className="text-muted-foreground">
                        {resumenPermisos(usuario).activos} de {resumenPermisos(usuario).total}
                      </span>
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Editar ${usuario.fullName || usuario.username}`}
                        onClick={() => {
                          setSelectedUsuario(usuario)
                          setDialogInitial(undefined)
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
                </div>
              )
            })
          )}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card md:block">
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
        initialValues={dialogInitial}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteUsuarioDialog
        usuario={usuarioToDelete}
        onClose={() => setUsuarioToDelete(null)}
      />
      <PermisosDrawer
        usuario={permisosDe}
        onClose={() => setPermisosId(null)}
        onChange={cambiarPermiso}
        disabled={isUpdating}
      />
    </>
  )
}

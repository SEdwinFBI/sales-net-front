import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, MapPin, Phone, Search, Store, Trash2, UserPlus, Users } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage } from '@/lib/api-error'
import { useUsuarios } from '@/features/admin'
import { useSucursalDetalle } from '../hooks/useSucursalDetalle'
import { useSetAccesoUsuarioSucursal } from '../hooks/useSetAccesoUsuarioSucursal'

export default function SucursalDetallePage() {
  const { id } = useParams<{ id: string }>()
  const idSucursal = Number(id)
  const navigate = useNavigate()

  const { data: sucursal, isLoading } = useSucursalDetalle(idSucursal)
  const { data: usuarios } = useUsuarios()
  const { mutateAsync: setAcceso, isPending } = useSetAccesoUsuarioSucursal()

  const [search, setSearch] = useState('')
  const [nuevoUsuarioId, setNuevoUsuarioId] = useState('')
  const [accionandoId, setAccionandoId] = useState<number | null>(null)

  const asignados = sucursal?.usuarios ?? []
  const asignadosFiltrados = asignados.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const vendedoresDisponibles = useMemo(() => {
    const asignadosIds = new Set(asignados.map((u) => u.id))
    return usuarios.filter((u) => u.role === 'vendedor' && !asignadosIds.has(u.id))
  }, [usuarios, asignados])

  const handleAgregar = async () => {
    if (!nuevoUsuarioId) return
    const idUsuario = Number(nuevoUsuarioId)
    setAccionandoId(idUsuario)
    try {
      await setAcceso({ idSucursal, idUsuario, activo: true })
      setNuevoUsuarioId('')
      toast.success('Usuario agregado a la sucursal')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al agregar el usuario'))
    } finally {
      setAccionandoId(null)
    }
  }

  const handleQuitar = async (idUsuario: number, nombre: string) => {
    setAccionandoId(idUsuario)
    try {
      await setAcceso({ idSucursal, idUsuario, activo: false })
      toast.success(`${nombre} ya no tiene acceso a esta sucursal`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al quitar el acceso'))
    } finally {
      setAccionandoId(null)
    }
  }

  return (
    <PageTemplateSimple
      title={sucursal ? `Equipo de ${sucursal.nombre}` : 'Equipo de la sucursal'}
      description="Usuarios con acceso a esta sucursal: agrégalos o quítales el acceso sin tocar sus otras sucursales."
    >
      <div className="mb-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/administracion/sucursales')}>
          <ArrowLeft />
          Volver a sucursales
        </Button>
      </div>

      {sucursal && (
        <Card className="mb-4 flex flex-col gap-3 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{sucursal.nombre}</p>
                <Badge
                  variant={sucursal.activo ? 'default' : 'secondary'}
                  className="px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                >
                  {sucursal.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {sucursal.direccion && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {sucursal.direccion}
                  </span>
                )}
                {sucursal.telefono && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {sucursal.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
            <Users className="size-3.5" />
            {asignados.length} usuario{asignados.length === 1 ? '' : 's'}
          </div>
        </Card>
      )}

      <Card className="mt-2 space-y-4 bg-card p-3.5 sm:mt-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar en el equipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Select
              className="w-full sm:w-56"
              value={nuevoUsuarioId}
              onChange={(e) => setNuevoUsuarioId(e.target.value)}
            >
              <option value="">Selecciona un usuario...</option>
              {vendedoresDisponibles.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
              ))}
            </Select>
            <Button onClick={handleAgregar} disabled={!nuevoUsuarioId || isPending}>
              {isPending && accionandoId === Number(nuevoUsuarioId) ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Agregar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <EmptyState title="Cargando equipo…" />
        ) : asignadosFiltrados.length === 0 ? (
          <EmptyState icon={Users} title={search ? 'No se encontraron usuarios.' : 'Esta sucursal aún no tiene usuarios asignados.'} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignadosFiltrados.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{usuario.username}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={isPending && accionandoId === usuario.id}
                        onClick={() => handleQuitar(usuario.id, usuario.full_name)}
                      >
                        {isPending && accionandoId === usuario.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageTemplateSimple>
  )
}

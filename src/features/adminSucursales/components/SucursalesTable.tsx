import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Pencil, Phone, Plus, Search, Store, Trash2, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Sucursal } from '../types/sucursal-types'
import SucursalDialog from './SucursalDialog'
import DeleteSucursalDialog from './DeleteSucursalDialog'

type Props = {
  data: Sucursal[]
  isLoading: boolean
}

export default function SucursalesTable({ data, isLoading }: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)
  const [sucursalToDelete, setSucursalToDelete] = useState<Sucursal | null>(null)

  const filtradas = data.filter((sucursal) => {
    const term = search.toLowerCase()
    return (
      sucursal.nombre.toLowerCase().includes(term) ||
      sucursal.direccion.toLowerCase().includes(term)
    )
  })

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] lg:min-w-[420px] lg:max-w-2xl">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sucursal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearch('')}
              disabled={!search}
              className={cn('w-full sm:w-auto', !search && 'hidden sm:inline-flex')}
            >
              <X />
              Limpiar
            </Button>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => { setSelectedSucursal(null); setDialogOpen(true) }}
          >
            <Plus />
            Nueva sucursal
          </Button>
        </div>

        {/* Grid de tarjetas */}
        {isLoading ? (
          <EmptyState title="Cargando sucursales…" />
        ) : filtradas.length === 0 ? (
          <EmptyState icon={Store} title={search ? 'No se encontraron sucursales.' : 'Aún no hay sucursales registradas.'} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtradas.map((sucursal) => (
              <Card
                key={sucursal.id}
                className={cn(
                  'border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
                  sucursal.activo ? 'border-l-primary' : 'border-l-muted-foreground/30 opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Store className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug">{sucursal.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sucursal.direccion || 'Sin dirección registrada'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={sucursal.activo ? 'default' : 'secondary'}
                    className="shrink-0 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                  >
                    {sucursal.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {sucursal.usuarios_count ?? 0} usuario{sucursal.usuarios_count === 1 ? '' : 's'}
                  </span>
                  {sucursal.telefono && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {sucursal.telefono}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/administracion/sucursales/${sucursal.id}`)}
                  >
                    <Users />
                    Ver equipo
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Editar ${sucursal.nombre}`}
                    onClick={() => { setSelectedSucursal(sucursal); setDialogOpen(true) }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Desactivar ${sucursal.nombre}`}
                    onClick={() => setSucursalToDelete(sucursal)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filtradas.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtradas.length} de {data.length} sucursales
          </p>
        )}
      </div>

      <SucursalDialog
        open={dialogOpen}
        sucursal={selectedSucursal}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteSucursalDialog
        sucursal={sucursalToDelete}
        onClose={() => setSucursalToDelete(null)}
      />
    </>
  )
}

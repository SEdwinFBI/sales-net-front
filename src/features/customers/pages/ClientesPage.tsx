import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useClientes } from '../hooks/useClientes'
import ClienteCard from '../components/ClienteCard'
import ClienteCardSkeleton from '../components/ClienteCardSkeleton'
import ClienteDialog from '../components/ClienteDialog'
import DeleteClienteDialog from '../components/DeleteClienteDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import type { Cliente } from '../types/clientes'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/core/store/auth-store'

export default function ClientesPage() {
  const user = useAuthStore(s => s.user)
  const { data: clientes, isLoading } = useClientes()
  const [search, setSearch] = useState('')
  const [filterActivo, setFilterActivo] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)

  const clientesList = Array.isArray(clientes) ? clientes : []
  const filtered = clientesList.filter((c) => {
    const q = search.toLowerCase()
    const nombre = (c.nombre_completo || '').toLowerCase()
    const telefono = c.telefono || ''
    const matchesSearch = !q || nombre.includes(q) || telefono.includes(q)
    const matchesActivo = filterActivo === 'todos' || (filterActivo === 'activo' && c.activo) || (filterActivo === 'inactivo' && !c.activo)
    return matchesSearch && matchesActivo
  })

  return (
    <PageTemplateSimple title="Clientes" description="Gestión de clientes del sistema.">
      <div className="space-y-5">
        <Card className="p-3.5 sm:p-5">


          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-primary-nav/35 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value)}
                className="w-full sm:w-32"
              >
                <option value="todos">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </Select>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => { setSelectedCliente(null); setDialogOpen(true) }} disabled={user?.role !== 'admin'}>
              <Plus />
              Nuevo cliente
            </Button>
          </div>

          {isLoading && filtered.length === 0 ? (
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ClienteCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground sm:p-12">
              {search || filterActivo !== 'todos' ? 'No hay clientes que coincidan con los filtros.' : 'No hay clientes registrados.'}
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onEdit={() => { setSelectedCliente(cliente); setDialogOpen(true) }}
                  onDelete={() => setClienteToDelete(cliente)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <ClienteDialog
        open={dialogOpen}
        cliente={selectedCliente}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteClienteDialog
        cliente={clienteToDelete}
        onClose={() => setClienteToDelete(null)}
      />
    </PageTemplateSimple>
  )
}

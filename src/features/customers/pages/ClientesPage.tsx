import { useEffect, useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useClientes } from '../hooks/useClientes'
import ClienteCard from '../components/ClienteCard'
import ClienteCardSkeleton from '../components/ClienteCardSkeleton'
import ClienteDialog from '../components/ClienteDialog'
import DeleteClienteDialog from '../components/DeleteClienteDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Search, Plus, Users, Wallet, Tag } from 'lucide-react'
import type { Cliente, TipoCliente } from '../types/clientes'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/core/store/auth-store'
import Paginator from '@/components/shared/table/Paginator'

const secciones: { value: TipoCliente | ''; label: string; icon: typeof Users; activeClass: string }[] = [
  { value: '', label: 'Todos', icon: Users, activeClass: 'border-primary/30 bg-primary/10 text-primary' },
  { value: 'GENERAL', label: 'Crédito y precios', icon: Wallet, activeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { value: 'SOLO_PRECIOS', label: 'Solo precios', icon: Tag, activeClass: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300' },
]

export default function ClientesPage() {
  const user = useAuthStore(s => s.user)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterActivo, setFilterActivo] = useState('todos')
  const [filterTipo, setFilterTipo] = useState<TipoCliente | ''>('')
  const activo = filterActivo === 'todos' ? undefined : filterActivo === 'activo'
  const { data: clientes, count, isLoading } = useClientes(page, pageSize, debouncedSearch, activo, filterTipo || undefined)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const clientesList = Array.isArray(clientes) ? clientes : []
  const filtered = clientesList

  return (
    <PageTemplateSimple title="Clientes" description="Gestión de clientes del sistema.">
      <div className="space-y-5">
        <Card className="p-3.5 sm:p-5">
          <div className="space-y-2">
            <div role="group" aria-label="Secciones de clientes" className="flex flex-wrap gap-2">
              {secciones.map(({ value, label, icon: Icon, activeClass }) => (
                <Button
                  key={value}
                  variant="outline"
                  aria-pressed={filterTipo === value}
                  onClick={() => { setFilterTipo(value); setPage(1) }}
                  className={`flex-1 sm:flex-none ${filterTipo === value ? activeClass : ''}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filterTipo === 'SOLO_PRECIOS'
                ? 'Precios pactados y compras al contado. Sin crédito ni abonos.'
                : filterTipo === 'GENERAL'
                  ? 'Clientes con precios pactados, crédito y abonos habilitados.'
                  : 'Verde: crédito y precios. Violeta: solo precios.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-primary-nav/35 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:max-w-3xl sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select
                value={filterActivo}
                onChange={(e) => { setFilterActivo(e.target.value); setPage(1) }}
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
              {search || filterActivo !== 'todos' || filterTipo ? 'No hay clientes que coincidan con los filtros.' : 'No hay clientes registrados.'}
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
          {count > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, count)} de {count} clientes
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground" htmlFor="clientes-page-size">
                  Filas por página
                  <Select
                    id="clientes-page-size"
                    className="w-20"
                    value={String(pageSize)}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </Select>
                </label>
                <Paginator page={page} totalPages={Math.ceil(count / pageSize)} onPageChange={setPage} />
              </div>
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

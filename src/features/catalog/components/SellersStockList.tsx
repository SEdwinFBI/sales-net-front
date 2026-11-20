import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Store } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Sucursal } from '@/features/admin'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { paginationTool, slicePagination } from '@/features/agent/pagination-tools'

type Props = {
  isLoading: boolean
  sucursales: Sucursal[]
  onSelect: (sucursal: Sucursal) => void
}

const pageSize = 9

export default function SellersStockList({ isLoading, sucursales, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const filteredSucursales = sucursales.filter((sucursal) =>
    sucursal.nombre.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(Math.ceil(filteredSucursales.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedSucursales = filteredSucursales.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Paginación para el agente (tamaño fijo, como en la pantalla).
  useAgentTools('paginacion-sucursales', [paginationTool('sucursales', 'la lista de sucursales', slicePagination(filteredSucursales.length, pageSize, safePage, setCurrentPage))])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (sucursales.length === 0) {
    return <EmptyState icon={Store} title="No hay sucursales registradas." />
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar sucursal..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {filteredSucursales.length === 0 ? (
        <EmptyState icon={Store} title="No se encontraron sucursales." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedSucursales.map((sucursal) => (
            <Card
              key={sucursal.id}
              className="group border-l-4 border-l-primary bg-card p-0 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover focus-within:shadow-card-hover"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => onSelect(sucursal)}
              >
                <div className="flex w-full min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Store className="size-5" />
                  </div>
                  <CardHeader className="min-w-0 p-0">
                    <CardTitle className="break-words text-base leading-snug">{sucursal.nombre}</CardTitle>
                  </CardHeader>
                </div>
                <span className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 px-3 text-xs font-semibold text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary sm:h-7.5 sm:w-auto">
                  Abrir
                </span>
              </button>
            </Card>
          ))}
        </div>
      )}
      {filteredSucursales.length > pageSize && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredSucursales.length} sucursales - Página {safePage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Página anterior"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Página siguiente"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={safePage === totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

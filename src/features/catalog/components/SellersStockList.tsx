import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'

type Props = {
  isLoading: boolean
  sellers: Usuario[]
  onSelect: (seller: Usuario) => void
}

const pageSize = 9

export default function SellersStockList({ isLoading, sellers, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const filteredSellers = sellers.filter((seller) => {
    const term = search.toLowerCase()

    return (
      seller.fullName.toLowerCase().includes(term) ||
      seller.username.toLowerCase().includes(term)
    )
  })
  const totalPages = Math.max(Math.ceil(filteredSellers.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedSellers = filteredSellers.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (isLoading) {
    return <EmptyState title="Cargando vendedores…" />
  }

  if (sellers.length === 0) {
    return <EmptyState icon={UserRound} title="No hay vendedores registrados." />
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar vendedor..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {filteredSellers.length === 0 ? (
        <EmptyState icon={UserRound} title="No se encontraron vendedores." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedSellers.map((seller) => (
            <Card
              key={seller.id}
              className="group border-l-4 border-l-primary bg-card p-0 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => onSelect(seller)}
              >
                <div className="flex w-full min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                  </div>
                  <CardHeader className="min-w-0 p-0">
                    <CardTitle className="break-words text-base leading-snug">{seller.fullName}</CardTitle>
                    <p className="break-words text-sm text-muted-foreground">{seller.username}</p>
                  </CardHeader>
                </div>
                <span className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary sm:h-7 sm:w-auto">
                  Abrir
                </span>
              </button>
            </Card>
          ))}
        </div>
      )}
      {filteredSellers.length > pageSize && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredSellers.length} vendedores - Página {safePage} de {totalPages}
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

import { UserRound } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'

type Props = {
  isLoading: boolean
  sellers: Usuario[]
  onSelect: (seller: Usuario) => void
}

export default function SellersStockList({ isLoading, sellers, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
        Cargando vendedores...
      </div>
    )
  }

  if (sellers.length === 0) {
    return (
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
        No hay vendedores registrados.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sellers.map((seller) => (
        <Card
          key={seller.id}
          className="group bg-white p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl"
        >
          <button
            type="button"
            className="flex w-full flex-col gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
            onClick={() => onSelect(seller)}
          >
            <div className="flex w-full min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <UserRound className="size-5" />
              </div>
              <CardHeader className="min-w-0 p-0">
                <CardTitle className="break-words text-base leading-snug">{seller.fullName}</CardTitle>
                <p className="break-words text-sm text-muted-foreground">{seller.username}</p>
              </CardHeader>
            </div>
            <span className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary sm:h-7 sm:w-auto">
              Abrir
            </span>
          </button>
        </Card>
      ))}
    </div>
  )
}

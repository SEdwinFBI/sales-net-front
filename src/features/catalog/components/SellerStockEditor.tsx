import { useCallback, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Save,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { cn } from '@/lib/utils'
import { useSaveSellerStock } from '../hooks/useSaveSellerStock'
import type { Article } from '../types/article-types'
import type { ArticleVariant } from '../types/article-variant-types'
import type { StockAssignment } from '../types/stock-types'
import ArticleImage from './ArticleImage'
import {
  getStockAccentBorderClass,
  getStockInputClass,
  getStockTextClass,
} from '@/lib/stock-status'

const pageSize = 8

type Props = {
  articles: Article[]
  isLoading: boolean
  seller: Usuario
  stock: StockAssignment[]
  variants: ArticleVariant[]
  onBack: () => void
}

export default function SellerStockEditor({
  articles,
  isLoading,
  seller,
  stock,
  variants,
  onBack,
}: Props) {
  const { mutateAsync: saveStock, isPending } = useSaveSellerStock()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [draftQuantities, setDraftQuantities] = useState<Record<number, number>>({})
  const [expandedArticles, setExpandedArticles] = useState<Record<number, boolean>>({})

  const stockByVariant = useMemo(
    () =>
      stock.reduce<Record<number, number>>((acc, item) => {
        acc[item.variantId] = item.quantity
        return acc
      }, {}),
    [stock]
  )

  const getQuantity = useCallback(
    (variantId: number) => draftQuantities[variantId] ?? stockByVariant[variantId] ?? 0,
    [draftQuantities, stockByVariant]
  )

  const rows = useMemo(
    () =>
      [...articles]
        .filter((article) => article.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((article) => {
          const articleVariants = variants
            .filter((item) => item.articleId === article.id)
            .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }))

          const sizeRows = articleVariants.map((variant) => {
            return {
              size: variant.size,
              variant,
              quantity: getQuantity(variant.id),
            }
          })

          return {
            article,
            sizes: sizeRows,
            availableSizes: sizeRows.filter(
              (item): item is typeof item & { variant: ArticleVariant } => !!item.variant
            ),
            assignedSizes: sizeRows.filter(
              (item): item is typeof item & { variant: ArticleVariant } =>
                !!item.variant && item.quantity > 0
            ),
            total: sizeRows.reduce((sum, item) => sum + item.quantity, 0),
          }
        }),
    [articles, getQuantity, search, variants]
  )
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleQuantityChange = (variantId: number, value: string) => {
    const quantity = Math.max(0, Number(value) || 0)
    setDraftQuantities((current) => ({ ...current, [variantId]: quantity }))
  }

  const adjustQuantity = (variantId: number, amount: number) => {
    setDraftQuantities((current) => ({
      ...current,
      [variantId]: Math.max(0, (current[variantId] ?? stockByVariant[variantId] ?? 0) + amount),
    }))
  }

  const toggleArticle = (articleId: number) => {
    setExpandedArticles((current) => ({
      ...current,
      [articleId]: !(current[articleId] ?? false),
    }))
  }

  const handleSave = async () => {
    const items = variants.map((variant) => ({
      variantId: variant.id,
      quantity: getQuantity(variant.id),
    }))

    try {
      await saveStock({ sellerId: seller.id, items })
      toast.success('Stock guardado correctamente')
    } catch {
      toast.error('Error al guardar el stock')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button size="icon-sm" variant="outline" onClick={onBack} aria-label="Volver a vendedores">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{seller.fullName}</p>
            <p className="text-sm text-muted-foreground">Stock asignado por talla</p>
          </div>
        </div>

        <Button className="w-full sm:w-auto" onClick={handleSave} disabled={isPending || isLoading}>
          <Save />
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar articulo..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Cargando stock...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No se encontraron articulos.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedRows.map((row) => {
            const isExpanded = expandedArticles[row.article.id] ?? false
            const stockSummary =
              row.availableSizes.length === 0
                ? 'Sin tallas configuradas'
                : row.total > 0
                  ? `${row.total} unidades asignadas`
                  : 'Sin stock asignado'

            return (
              <Card
                key={row.article.id}
                size="sm"
                className={cn(
                  "border-l-4 bg-white p-0 shadow-sm transition-shadow hover:shadow-md",
                  getStockAccentBorderClass(row.total)
                )}
              >
                <div className="p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <ArticleImage
                        className="size-14 shrink-0 rounded-lg object-cover shadow-sm sm:size-16"
                        src={row.article.image}
                        alt={row.article.title}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold sm:text-base">
                          {row.article.title}
                        </p>
                        <p className={cn("mt-0.5 truncate text-sm", getStockTextClass(row.total))}>
                          {stockSummary}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:justify-end">
                      {row.availableSizes.length > 0 && (
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {row.availableSizes.length} tallas
                        </span>
                      )}
                      <Button
                        type="button"
                        variant={isExpanded ? 'default' : 'outline'}
                        className="w-full justify-between sm:w-44"
                        disabled={row.availableSizes.length === 0}
                        onClick={() => toggleArticle(row.article.id)}
                      >
                        {isExpanded ? 'Cerrar' : 'Asignar stock'}
                        <ChevronDown
                          className={cn(
                            'transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  {row.availableSizes.length === 0 ? (
                    <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                      Sin tallas configuradas para este articulo
                    </div>
                  ) : (
                    isExpanded && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-white">
                        <div className="hidden grid-cols-[minmax(6rem,1fr)_12rem] bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                          <span>Talla</span>
                          <span className="text-center">Cantidad</span>
                        </div>
                        <div className="divide-y divide-border">
                          {row.availableSizes.map(({ quantity, size, variant }) => (
                            <div
                              key={variant.id}
                              className="grid gap-3 p-3 transition-colors focus-within:bg-primary/5 sm:grid-cols-[minmax(6rem,1fr)_12rem] sm:items-center sm:px-4"
                            >
                              <div className="flex items-center justify-between gap-2 sm:block">
                                <span className="text-sm font-semibold">Talla {size}</span>
                                <span className={cn("text-xs sm:hidden", getStockTextClass(quantity))}>
                                  {quantity} unidades
                                </span>
                              </div>
                              <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2">
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Restar una unidad de talla ${size}`}
                                    disabled={quantity === 0}
                                  onClick={() => adjustQuantity(variant.id, -1)}
                                >
                                  <Minus />
                                </Button>
                                <Input
                                  className={cn("h-9 text-center font-semibold", getStockInputClass(quantity))}
                                  min={0}
                                  type="number"
                                  value={quantity}
                                  onChange={(event) =>
                                    handleQuantityChange(variant.id, event.target.value)
                                  }
                                />
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label={`Sumar una unidad de talla ${size}`}
                                  onClick={() => adjustQuantity(variant.id, 1)}
                                >
                                  <Plus />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )
          })}
          {rows.length > pageSize && (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {rows.length} articulos - Pagina {safePage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Pagina anterior"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Pagina siguiente"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

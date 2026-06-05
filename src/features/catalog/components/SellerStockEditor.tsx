import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, Minus, Plus, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { cn } from '@/lib/utils'
import { useSaveSellerStock } from '../hooks/useSaveSellerStock'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'
import type { StockAssignment } from '../types/stock-types'
import ArticleImage from './ArticleImage'

const sizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']

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
          const sizeRows = sizes.map((size) => {
            const variant = variants.find(
              (item) => item.articleId === article.id && item.size === size
            )

            return {
              size,
              variant,
              quantity: variant ? getQuantity(variant.id) : 0,
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
          <Button size="icon-sm" variant="outline" onClick={onBack}>
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

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar articulo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
          {rows.map((row) => {
            const isExpanded = expandedArticles[row.article.id] ?? false

            return (
              <Card
                key={row.article.id}
                size="sm"
                className="border-l-4 border-l-primary/70 bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="space-y-4 p-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_auto] lg:items-center">
                    <div className="flex min-w-0 gap-3">
                      <ArticleImage
                        className="size-16 shrink-0 rounded-lg object-cover shadow-sm sm:size-18"
                        src={row.article.image}
                        alt={row.article.title}
                      />
                      <CardHeader className="min-w-0 p-0">
                        <CardTitle className="truncate text-base leading-snug">
                          {row.article.title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Stock por talla
                        </p>
                      </CardHeader>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Stock
                          </p>
                          <p className="text-sm font-semibold">{row.total}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Tallas
                          </p>
                          <p className="text-sm font-semibold">{row.availableSizes.length}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Asignadas
                          </p>
                          <p className="text-sm font-semibold">{row.assignedSizes.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:justify-end">
                      <Button
                        type="button"
                        variant={isExpanded ? 'default' : 'outline'}
                        className="w-full justify-between sm:w-44 lg:w-40"
                        disabled={row.availableSizes.length === 0}
                        onClick={() => toggleArticle(row.article.id)}
                      >
                        {isExpanded ? 'Ocultar tallas' : 'Asignar tallas'}
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
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]">
                          {row.availableSizes.map(({ quantity, size, variant }) => (
                            <div
                              key={size}
                              className="rounded-lg border border-border bg-white p-3 shadow-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5"
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold">Talla {size}</span>
                                <Badge variant={quantity > 0 ? 'default' : 'outline'}>
                                  {quantity}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2">
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  disabled={quantity === 0}
                                  onClick={() => adjustQuantity(variant.id, -1)}
                                >
                                  <Minus />
                                </Button>
                                <Input
                                  className="h-9 text-center font-semibold"
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
        </div>
      )}
    </div>
  )
}

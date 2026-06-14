import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'
import ArticleImage from './ArticleImage'
import ArticleDialog from './ArticleDialog'
import DeleteArticleDialog from './DeleteArticleDialog'

type Props = {
  data: Article[]
  variants?: ArticleVariant[]
  isLoading: boolean
}

const formatPrice = (value: number) => `Q${value.toFixed(2)}`
const pageSize = 12

export default function ArticlesGrid({ data, variants = [], isLoading }: Props) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState<'all' | ArticleSize>('all')
  const [sizesStateFilter, setSizesStateFilter] = useState<'all' | 'with-sizes' | 'without-sizes'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const availableSizes = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.size))).sort(),
    [variants]
  )
  const hasActiveFilters = globalFilter.length > 0 || sizeFilter !== 'all' || sizesStateFilter !== 'all'
  const filteredData = data.filter((article) => {
    const term = globalFilter.toLowerCase()
    const articleSizes = variants
      .filter((variant) => variant.articleId === article.id)
      .map((variant) => variant.size)
    const matchesSearch = article.title.toLowerCase().includes(term)
    const matchesSize = sizeFilter === 'all' || articleSizes.includes(sizeFilter)
    const matchesSizesState =
      sizesStateFilter === 'all' ||
      (sizesStateFilter === 'with-sizes' && articleSizes.length > 0) ||
      (sizesStateFilter === 'without-sizes' && articleSizes.length === 0)

    return matchesSearch && matchesSize && matchesSizesState
  })
  const totalPages = Math.max(Math.ceil(filteredData.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize)

  const clearFilters = () => {
    setGlobalFilter('')
    setSizeFilter('all')
    setSizesStateFilter('all')
    setCurrentPage(1)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-white p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-2.5 sm:grid-cols-2 lg:min-w-[680px] lg:max-w-4xl lg:grid-cols-[minmax(220px,1fr)_150px_170px_auto]">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar artículo..."
                value={globalFilter}
                onChange={(event) => {
                  setGlobalFilter(event.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              aria-label="Filtrar por talla"
              value={sizeFilter}
              onChange={(event) => {
                setSizeFilter(event.target.value as 'all' | ArticleSize)
                setCurrentPage(1)
              }}
            >
              <option value="all">Todas las tallas</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  Talla {size}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por estado de tallas"
              value={sizesStateFilter}
              onChange={(event) => {
                setSizesStateFilter(event.target.value as 'all' | 'with-sizes' | 'without-sizes')
                setCurrentPage(1)
              }}
            >
              <option value="all">Todos</option>
              <option value="with-sizes">Con tallas</option>
              <option value="without-sizes">Sin tallas</option>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={cn('w-full sm:w-auto', !hasActiveFilters && 'hidden lg:inline-flex')}
            >
              <X />
              Limpiar
            </Button>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => { setSelectedArticle(null); setDialogOpen(true) }}
          >
            <Plus />
            Nuevo artículo
          </Button>
        </div>

        {isLoading ? (
          <EmptyState title="Cargando artículos…" className="bg-white" />
        ) : filteredData.length === 0 ? (
          <EmptyState icon={Package} title="No hay artículos registrados." className="bg-white" />
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedData.map((article) => {
              const articleVariants = variants.filter((variant) => variant.articleId === article.id)
              const articleSizes = articleVariants
                .map((variant) => variant.size)
              const prices = articleVariants
                .map((variant) => variant.price)
                .filter((price) => Number.isFinite(price))
              const minPrice = prices.length > 0 ? Math.min(...prices) : null
              const maxPrice = prices.length > 0 ? Math.max(...prices) : null
              const priceLabel =
                minPrice === null
                  ? 'Sin precio'
                  : minPrice === maxPrice
                    ? formatPrice(minPrice)
                    : `Desde ${formatPrice(minPrice)}`

              return (
                <Card
                  key={article.id}
                  size="sm"
                  className="group overflow-hidden bg-white py-0 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
                >
                  <div className="relative overflow-hidden">
                    <ArticleImage
                      className="h-32 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105 sm:h-36"
                      src={article.image}
                      alt={article.title}
                    />
                    <div className="absolute inset-x-0 top-0 flex justify-end bg-gradient-to-b from-black/35 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="mr-1 bg-white/95 text-slate-700 shadow-sm hover:bg-white focus-visible:ring-white/70"
                        aria-label={`Editar ${article.title}`}
                        onClick={() => {
                          setSelectedArticle(article)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="bg-white/95 text-destructive shadow-sm hover:bg-white hover:text-destructive/80 focus-visible:ring-white/70"
                        aria-label={`Eliminar ${article.title}`}
                        onClick={() => setArticleToDelete(article)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="px-3 pb-3">
                    <CardTitle className="break-words text-sm leading-snug">{article.title}</CardTitle>
                    <div className="mt-2 flex flex-col gap-1 border-t border-border/50 pt-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                      <p className="break-words text-sm font-semibold text-primary">
                        {priceLabel}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {articleSizes.length > 0 ? `${articleSizes.length} tallas` : 'Sin tallas'}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
        {filteredData.length > pageSize && (
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {filteredData.length} artículos - Página {safePage} de {totalPages}
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

      <ArticleDialog
        key={`${dialogOpen ? 'open' : 'closed'}-${selectedArticle?.id ?? 'new'}-${variants
          .filter((variant) => variant.articleId === selectedArticle?.id)
          .map((variant) => variant.id)
          .join('-')}`}
        open={dialogOpen}
        article={selectedArticle}
        variants={variants}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteArticleDialog
        article={articleToDelete}
        onClose={() => setArticleToDelete(null)}
      />
    </>
  )
}

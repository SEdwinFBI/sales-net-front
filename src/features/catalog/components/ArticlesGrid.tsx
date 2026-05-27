import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'
import ArticleDialog from './ArticleDialog'
import DeleteArticleDialog from './DeleteArticleDialog'

type Props = {
  data: Article[]
  variants?: ArticleVariant[]
  isLoading: boolean
}

export default function ArticlesGrid({ data, variants = [], isLoading }: Props) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState<'all' | ArticleSize>('all')
  const [sizesStateFilter, setSizesStateFilter] = useState<'all' | 'with-sizes' | 'without-sizes'>('all')
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

  const clearFilters = () => {
    setGlobalFilter('')
    setSizeFilter('all')
    setSizesStateFilter('all')
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px_170px_auto] lg:min-w-[680px] lg:max-w-4xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar articulo..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              aria-label="Filtrar por talla"
              value={sizeFilter}
              onChange={(event) => setSizeFilter(event.target.value as 'all' | ArticleSize)}
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
              onChange={(event) =>
                setSizesStateFilter(event.target.value as 'all' | 'with-sizes' | 'without-sizes')
              }
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
              className="w-full sm:w-auto"
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
            Nuevo articulo
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
            Cargando articulos...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
            No hay articulos registrados.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filteredData.map((article) => {
              const articleSizes = variants
                .filter((variant) => variant.articleId === article.id)
                .map((variant) => variant.size)

              return (
                <Card
                  key={article.id}
                  size="sm"
                  className="group bg-white py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl"
                >
                  <div className="relative overflow-hidden">
                    <img
                      className="h-32 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105 sm:h-36"
                      src={article.image}
                      alt={article.title}
                    />
                    <div className="absolute inset-x-0 top-0 flex justify-end bg-gradient-to-b from-black/45 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="mr-2 border-white/60 bg-white/95 text-slate-700 shadow-md hover:bg-white focus-visible:ring-white/70"
                        onClick={() => {
                          setSelectedArticle(article)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        className="border border-white/60 bg-red-600 text-white shadow-md hover:bg-red-700 focus-visible:ring-white/70"
                        onClick={() => setArticleToDelete(article)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="px-3 pb-3">
                    <CardTitle className="text-sm leading-snug">{article.title}</CardTitle>
                    <div className="flex min-h-5 flex-wrap gap-1 pt-1">
                      {articleSizes.length > 0 ? (
                        articleSizes.map((size) => (
                          <Badge key={size} variant="secondary">
                            Talla {size}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin tallas</span>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <ArticleDialog
        key={`${selectedArticle?.id ?? 'new'}-${variants
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

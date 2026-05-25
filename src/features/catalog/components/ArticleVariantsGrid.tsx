import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCreateArticleVariant } from '../hooks/useCreateArticleVariant'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'
import DeleteArticleVariantDialog from './DeleteArticleVariantDialog'

const sizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']

type Props = {
  articles: Article[]
  variants: ArticleVariant[]
  isLoading: boolean
}

export default function ArticleVariantsGrid({ articles, variants, isLoading }: Props) {
  const { mutateAsync: createVariant, isPending } = useCreateArticleVariant()
  const [globalFilter, setGlobalFilter] = useState('')
  const [variantToDelete, setVariantToDelete] = useState<ArticleVariant | null>(null)
  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(globalFilter.toLowerCase())
  )

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === variantToDelete?.articleId),
    [articles, variantToDelete]
  )

  const handleSizeClick = async (article: Article, size: ArticleSize) => {
    const variant = variants.find(
      (item) => item.articleId === article.id && item.size === size
    )

    if (variant) {
      setVariantToDelete(variant)
      return
    }

    try {
      await createVariant({ articleId: article.id, size })
      toast.success(`Talla ${size} agregada a ${article.title}`)
    } catch {
      toast.error('Error al crear la talla')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
        Cargando categorias...
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Buscar articulo..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-xs"
        />
      </div>

      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
          No se encontraron articulos.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredArticles.map((article) => (
          <Card key={article.id} className="bg-white py-0 transition-shadow hover:shadow-xl">
            <img
              className="h-44 w-full object-cover object-center"
              src={article.image}
              alt={article.title}
            />
            <CardHeader className="px-4 pb-4">
              <CardTitle className="text-base">{article.title}</CardTitle>
              <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                {sizes.map((size) => {
                  const variant = variants.find(
                    (item) => item.articleId === article.id && item.size === size
                  )

                  return (
                    <Button
                      key={size}
                      size="sm"
                      variant={variant ? 'default' : 'outline'}
                      className={cn(
                        'w-full font-semibold',
                        variant
                          ? 'shadow-sm'
                          : 'border-dashed border-muted-foreground/40 text-muted-foreground'
                      )}
                      disabled={isPending}
                      onClick={() => handleSizeClick(article, size)}
                    >
                      Talla {size}
                    </Button>
                  )
                })}
              </div>
            </CardHeader>
          </Card>
          ))}
        </div>
      )}

      <DeleteArticleVariantDialog
        article={selectedArticle}
        variant={variantToDelete}
        onClose={() => setVariantToDelete(null)}
      />
    </>
  )
}

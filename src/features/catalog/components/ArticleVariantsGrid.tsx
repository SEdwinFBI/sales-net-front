import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [variantToDelete, setVariantToDelete] = useState<ArticleVariant | null>(null)

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {articles.map((article) => (
          <Card key={article.id} className="bg-white py-0 transition-shadow hover:shadow-xl">
            <img
              className="h-44 w-full object-cover object-center"
              src={article.image}
              alt={article.title}
            />
            <CardHeader className="px-4 pb-4">
              <CardTitle className="text-base">{article.title}</CardTitle>
              <div className="grid grid-cols-6 gap-2 pt-2">
                {sizes.map((size) => {
                  const variant = variants.find(
                    (item) => item.articleId === article.id && item.size === size
                  )

                  return (
                    <Button
                      key={size}
                      size="icon-sm"
                      variant={variant ? 'default' : 'outline'}
                      className={cn(
                        'font-semibold',
                        variant
                          ? 'shadow-sm'
                          : 'border-dashed border-muted-foreground/40 text-muted-foreground'
                      )}
                      disabled={isPending}
                      onClick={() => handleSizeClick(article, size)}
                    >
                      {size}
                    </Button>
                  )
                })}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <DeleteArticleVariantDialog
        article={selectedArticle}
        variant={variantToDelete}
        onClose={() => setVariantToDelete(null)}
      />
    </>
  )
}

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import ArticleVariantsGrid from '../components/ArticleVariantsGrid'
import { useArticles } from '../hooks/useArticles'
import { useArticleVariants } from '../hooks/useArticleVariants'

export default function ProductsCategories() {
  const { data: articles, isLoading: isLoadingArticles } = useArticles()
  const { data: variants, isLoading: isLoadingVariants } = useArticleVariants()

  return (
    <PageTemplateSimple
      title="Categorías"
      description="Clasificación de productos por categoría."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Categorías</p>
      </div>

      <div className="mt-4">
        <ArticleVariantsGrid
          articles={articles}
          variants={variants}
          isLoading={isLoadingArticles || isLoadingVariants}
        />
      </div>
    </PageTemplateSimple>
  )
}

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import ArticlesGrid from '../components/ArticlesGrid'
import { useArticleVariants } from '../hooks/useArticleVariants'
import { useArticles } from '../hooks/useArticles'

export default function ProductsList() {
  const { data, isLoading } = useArticles()
  const { data: variants, isLoading: isLoadingVariants } = useArticleVariants()

  return (
    <PageTemplateSimple
      title="Articulos"
      description="Listado de articulos del catalogo."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Articulos</p>
      </div>

      <div className="mt-4">
        <ArticlesGrid
          data={data}
          variants={variants}
          isLoading={isLoading || isLoadingVariants}
        />
      </div>
    </PageTemplateSimple>
  )
}

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
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

      <Card className="mt-2 bg-white p-3.5 sm:mt-3 sm:p-5">
        <ArticlesGrid
          data={data}
          variants={variants}
          isLoading={isLoading || isLoadingVariants}
        />
      </Card>
    </PageTemplateSimple>
  )
}

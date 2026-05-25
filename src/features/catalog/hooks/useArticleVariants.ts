import { useQuery } from '@tanstack/react-query'
import { getArticleVariants } from '../services/article-variants-service'
import type { ArticleVariant } from '../types/article-variant-types'

export const ARTICLE_VARIANTS_QUERY_KEY = ['catalogArticleVariants', 'list']

export const useArticleVariants = () => {
  const { data, isError, isLoading } = useQuery<ArticleVariant[]>({
    queryKey: ARTICLE_VARIANTS_QUERY_KEY,
    queryFn: getArticleVariants,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isError,
    isLoading,
  }
}

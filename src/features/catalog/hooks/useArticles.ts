import { useQuery } from '@tanstack/react-query'
import { getArticles } from '../services/articles-service'
import type { Article } from '../types/article-types'

export const ARTICLES_QUERY_KEY = ['catalogArticles', 'list']

export const useArticles = () => {
  const { data, isError, isLoading } = useQuery<Article[]>({
    queryKey: ARTICLES_QUERY_KEY,
    queryFn: getArticles,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isError,
    isLoading,
  }
}

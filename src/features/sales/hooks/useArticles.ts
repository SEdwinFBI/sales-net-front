import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getArticles } from '../services/products-service'

export const useArticles = (page = 1, pageSize = 10, search?: string) => {
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: queryKeys.sales.articles(page, pageSize, search),
    queryFn: () => getArticles(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 15,
  })

  return {
    articles: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    isError,
    isPlaceholderData,
  }
}

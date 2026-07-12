import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getArticleAvailability } from '../services/products-service'

export const useBranchAvailability = (articleId: number | null) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.sales.availability(articleId ?? 0),
    queryFn: () => getArticleAvailability(articleId!),
    enabled: articleId != null,
    // El stock cambia con cada venta en otras tiendas: cache corto y
    // refetch al volver a la pestaña.
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  })

  return {
    availability: data?.data,
    isLoading,
    isError,
    refetch,
  }
}

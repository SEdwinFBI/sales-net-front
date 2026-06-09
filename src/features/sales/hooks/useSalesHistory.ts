import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getSalesHistory } from '../services/products-service'
import type { Venta, SalesHistoryFilters } from '../types/sales'

export const useSalesHistory = (filters?: SalesHistoryFilters, idUser?: string) => {
  const { data, isLoading, isError } = useQuery<Venta[]>({
    queryKey: queryKeys.sales.historial(filters as Record<string, unknown> | undefined, idUser),
    queryFn: async () => {
      const res = await getSalesHistory(filters)
      return res.data
    },
  })

  return {
    ventas: data ?? [],
    isLoading,
    isError,
  }
}

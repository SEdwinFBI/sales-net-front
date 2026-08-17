import { useQuery } from '@tanstack/react-query'
import { getSellerStock } from '../services/stock-service'
import type { StockAssignment } from '../types/stock-types'

export const sellerStockQueryKey = (sucursalId?: number) => ['sellerStock', sucursalId]

export const useSellerStock = (sucursalId?: number) => {
  const { data, isError, isLoading } = useQuery<StockAssignment[]>({
    queryKey: sellerStockQueryKey(sucursalId),
    queryFn: () => getSellerStock(sucursalId as number),
    enabled: !!sucursalId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isError,
    isLoading,
  }
}

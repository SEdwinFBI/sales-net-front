import { useQuery } from '@tanstack/react-query'
import { getSellerStock } from '../services/stock-service'
import type { StockAssignment } from '../types/stock-types'

export const sellerStockQueryKey = (sellerId?: number) => ['sellerStock', sellerId]

export const useSellerStock = (sellerId?: number) => {
  const { data, isError, isLoading } = useQuery<StockAssignment[]>({
    queryKey: sellerStockQueryKey(sellerId),
    queryFn: () => getSellerStock(sellerId as number),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isError,
    isLoading,
  }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveSellerStock } from '../services/stock-service'
import type { SaveSellerStockPayload } from '../types/stock-types'
import { sellerStockQueryKey } from './useSellerStock'

export const useSaveSellerStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveSellerStockPayload) => saveSellerStock(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: sellerStockQueryKey(payload.sellerId) })
    },
  })
}

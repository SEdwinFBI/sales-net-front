import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { StockItem, CreateStockPayload, UpdateStockPayload } from '../types/admin-catalog-types'

export const useStock = () => {
  return useQuery<StockItem[]>({
    queryKey: queryKeys.adminCatalog.stock.list(),
    queryFn: service.getStock,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateStock = () => {
  const qc = useQueryClient()
  return useMutation<StockItem, Error, CreateStockPayload>({
    mutationFn: service.createStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.stock.all() }),
  })
}

export const useUpdateStock = () => {
  const qc = useQueryClient()
  return useMutation<StockItem, Error, { id: number; data: UpdateStockPayload }>({
    mutationFn: ({ id, data }) => service.updateStock(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.stock.all() }),
  })
}

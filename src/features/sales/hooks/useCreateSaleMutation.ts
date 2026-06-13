import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createAdminVenta } from '../services/products-service'
import type { CreateVentaPayload, CreateVentaResponse } from '../types/sales'

export const useCreateSaleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<CreateVentaResponse, Error, CreateVentaPayload>({
    mutationFn: createAdminVenta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVentas.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.historial() })
    },
  })
}

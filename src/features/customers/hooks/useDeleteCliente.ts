import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { deleteCliente } from '../services/clientes-service'
import type { ApiResponse } from '../types/clientes'

export const useDeleteCliente = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<string>, Error, number>({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.list() })
      invalidateDebtReports(queryClient)
    },
  })
}

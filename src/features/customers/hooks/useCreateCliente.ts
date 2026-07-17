import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { createCliente } from '../services/clientes-service'
import type { ApiResponse, Cliente, CreateClientePayload } from '../types/clientes'

export const useCreateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<Cliente>, Error, CreateClientePayload>({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.list() })
      invalidateDebtReports(queryClient)
    },
  })
}

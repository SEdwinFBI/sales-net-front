import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { updateCliente } from '../services/clientes-service'
import type { ApiResponse, Cliente, UpdateClientePayload } from '../types/clientes'

interface UpdateClienteVariables {
  id: number
  data: UpdateClientePayload
}

export const useUpdateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<Cliente>, Error, UpdateClienteVariables>({
    mutationFn: ({ id, data }) => updateCliente(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) })
      invalidateDebtReports(queryClient)
    },
  })
}

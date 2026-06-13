import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { patchEstadoVenta } from '../services/products-service'

export const useCambioEstadoVenta = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: number; estado: string }>({
    mutationFn: ({ id, estado }) => patchEstadoVenta(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVentas.all })
    },
  })
}

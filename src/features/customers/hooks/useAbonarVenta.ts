import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { abonarVenta } from '../services/clientes-service'
import type { AbonarPayload, AbonarResponse } from '../types/clientes'

interface AbonarVentaVariables {
  idVenta: number
  idCliente: number
  data: AbonarPayload
}

export const useAbonarVenta = () => {
  const queryClient = useQueryClient()

  return useMutation<AbonarResponse, Error, AbonarVentaVariables>({
    mutationFn: ({ idVenta, idCliente, data }) => abonarVenta(idVenta, idCliente, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      invalidateDebtReports(queryClient)
    },
  })
}

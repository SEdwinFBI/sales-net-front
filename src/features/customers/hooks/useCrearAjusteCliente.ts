import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { crearAjusteCliente } from '../services/clientes-service'
import type { AjusteClientePayload, AjusteClienteResponse } from '../types/clientes'

interface CrearAjusteVariables {
  idCliente: number
  data: AjusteClientePayload
}

export const useCrearAjusteCliente = () => {
  const queryClient = useQueryClient()

  return useMutation<AjusteClienteResponse, Error, CrearAjusteVariables>({
    mutationFn: ({ idCliente, data }) => crearAjusteCliente(idCliente, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      invalidateDebtReports(queryClient)
    },
  })
}

import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { getClienteById } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export const useCliente = (id: number) => {
  const { data, isLoading, isError } = useQuery<Cliente>({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getClienteById(id),
    enabled: !!id,
  })

  return {
    data,
    isLoading,
    isError,
  }
}

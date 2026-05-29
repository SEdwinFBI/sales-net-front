import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export const useClientes = () => {
  const { data, isLoading, isError } = useQuery<Cliente[]>({
    queryKey: queryKeys.customers.list(),
    placeholderData: [],
    queryFn: getClientes,
    staleTime: 1000 * 60 * 15,
  })

  return {
    data: data ?? [],
    isLoading,
    isError,
  }
}

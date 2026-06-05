import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export const useClientes = () => {
  const { data, isLoading, isError, isFetching } = useQuery<Cliente[]>({
    queryKey: queryKeys.customers.list(),
    queryFn: getClientes,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnMount: true,
  })

  return {
    data: Array.isArray(data) ? data : [],
    isLoading,
    isFetching,
    isError,
  }
}

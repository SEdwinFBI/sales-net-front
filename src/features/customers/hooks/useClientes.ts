import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export const useClientes = (page = 1) => {
  const { data, isLoading, isError, isFetching } = useQuery<{ count: number; results: Cliente[] }>({
    queryKey: [...queryKeys.customers.list(), page],
    queryFn: () => getClientes(page),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnMount: true,
  })

  return {
    data: data?.results ?? [],
    count: data?.count ?? 0,
    isLoading,
    isFetching,
    isError,
  }
}

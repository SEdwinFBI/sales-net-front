import { queryKeys } from '@/lib/query-keys'
import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export const useClientes = (page = 1, pageSize = 10, search = '', activo?: boolean) => {
  const { data, isLoading, isError, isFetching } = useQuery<{ count: number; results: Cliente[] }>({
    queryKey: [...queryKeys.customers.list(), page, pageSize, search, activo],
    queryFn: () => getClientes(page, pageSize, search, activo),
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

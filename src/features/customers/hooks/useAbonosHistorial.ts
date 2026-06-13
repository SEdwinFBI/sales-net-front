import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getAbonosHistorial } from '../services/clientes-service'
import type { Abono } from '../types/clientes'

export const useAbonosHistorial = (idCliente: number) => {
  const { data, isLoading, isError } = useQuery<Abono[]>({
    queryKey: queryKeys.customers.abonos(idCliente),
    queryFn: () => getAbonosHistorial(idCliente),
    enabled: !!idCliente,
  })

  return {
    abonos: data ?? [],
    isLoading,
    isError,
  }
}

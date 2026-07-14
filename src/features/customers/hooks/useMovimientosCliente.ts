import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getMovimientosCliente } from '../services/clientes-service'
import type { MovimientosData, MovimientosFilters } from '../types/clientes'

export const useMovimientosCliente = (idCliente: number, filters?: MovimientosFilters) => {
  const { data, isLoading, isError } = useQuery<MovimientosData>({
    queryKey: queryKeys.customers.movimientos(idCliente, filters as Record<string, unknown> | undefined),
    queryFn: () => getMovimientosCliente(idCliente, filters),
    enabled: !!idCliente,
  })

  return {
    movimientos: data?.movimientos ?? [],
    balanceActual: data?.balance_actual,
    isLoading,
    isError,
  }
}

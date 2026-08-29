import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getSucursales } from '../services/sucursales-service'
import type { Sucursal } from '../types/sucursal-types'

export const useSucursales = () => {
  const { data, isLoading, isError } = useQuery<Sucursal[]>({
    queryKey: queryKeys.adminSucursales.list(),
    queryFn: getSucursales,
    staleTime: 1000 * 60 * 5,
  })

  return { data: data ?? [], isLoading, isError }
}

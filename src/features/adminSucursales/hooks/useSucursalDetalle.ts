import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getSucursalById } from '../services/sucursales-service'
import type { SucursalConUsuarios } from '../types/sucursal-types'

export const useSucursalDetalle = (id: number | null) => {
  const { data, isLoading } = useQuery<SucursalConUsuarios>({
    queryKey: queryKeys.adminSucursales.detail(id ?? 0),
    queryFn: () => getSucursalById(id as number),
    enabled: id !== null,
  })

  return { data, isLoading }
}

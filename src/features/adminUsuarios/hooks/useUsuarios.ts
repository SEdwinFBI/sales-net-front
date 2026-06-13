import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getUsuarios } from '../services/usuarios-service'
import type { Usuario } from '../types/usuario-types'

export const useUsuarios = () => {
  const { data, isLoading, isError } = useQuery<Usuario[]>({
    queryKey: queryKeys.adminUsuarios.list(),
    queryFn: getUsuarios,
    staleTime: 1000 * 60 * 5,
  })

  return { data: data ?? [], isLoading, isError }
}

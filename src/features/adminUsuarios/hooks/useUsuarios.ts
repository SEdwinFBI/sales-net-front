import { useQuery } from '@tanstack/react-query'
import { getUsuarios } from '../services/usuarios-service'
import type { Usuario } from '../types/usuario-types'

const QUERY_KEY = ['adminUsuarios', 'list']

export const useUsuarios = () => {
  const { data, isLoading, isError } = useQuery<Usuario[]>({
    queryKey: QUERY_KEY,
    queryFn: getUsuarios,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: data ?? [],
    isLoading,
    isError,
  }
}
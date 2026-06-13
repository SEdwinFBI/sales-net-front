import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { Variante, CreateVariantePayload } from '../types/admin-catalog-types'

export const useVariantes = () => {
  return useQuery<Variante[]>({
    queryKey: queryKeys.adminCatalog.variantes.list(),
    queryFn: service.getVariantes,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateVariante = () => {
  const qc = useQueryClient()
  return useMutation<Variante, Error, CreateVariantePayload>({
    mutationFn: service.createVariante,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.variantes.all() }),
  })
}

export const useUpdateVariante = () => {
  const qc = useQueryClient()
  return useMutation<Variante, Error, { id: number; data: Partial<CreateVariantePayload> }>({
    mutationFn: ({ id, data }) => service.updateVariante(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.variantes.all() }),
  })
}

export const useDeleteVariante = () => {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: service.deleteVariante,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.variantes.all() }),
  })
}

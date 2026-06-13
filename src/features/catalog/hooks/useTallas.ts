import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { Talla, CreateTallaPayload, UpdateTallaPayload } from '../types/admin-catalog-types'

export const useTallas = () => {
  return useQuery<Talla[]>({
    queryKey: queryKeys.adminCatalog.tallas.list(),
    queryFn: service.getTallas,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateTalla = () => {
  const qc = useQueryClient()
  return useMutation<Talla, Error, CreateTallaPayload>({
    mutationFn: service.createTalla,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.tallas.all() }),
  })
}

export const useUpdateTalla = () => {
  const qc = useQueryClient()
  return useMutation<Talla, Error, { id: number; data: UpdateTallaPayload }>({
    mutationFn: ({ id, data }) => service.updateTalla(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.tallas.all() }),
  })
}

export const useDeleteTalla = () => {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: service.deleteTalla,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.tallas.all() }),
  })
}

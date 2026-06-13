import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { ReglaPrecio, CreateReglaPrecioPayload, UpdateReglaPrecioPayload } from '../types/admin-catalog-types'

export const useReglasPrecio = () => {
  return useQuery<ReglaPrecio[]>({
    queryKey: queryKeys.adminCatalog.reglasPrecio.list(),
    queryFn: service.getReglasPrecio,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateReglaPrecio = () => {
  const qc = useQueryClient()
  return useMutation<ReglaPrecio, Error, CreateReglaPrecioPayload>({
    mutationFn: service.createReglaPrecio,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.reglasPrecio.all() }),
  })
}

export const useUpdateReglaPrecio = () => {
  const qc = useQueryClient()
  return useMutation<ReglaPrecio, Error, { id: number; data: UpdateReglaPrecioPayload }>({
    mutationFn: ({ id, data }) => service.updateReglaPrecio(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.reglasPrecio.all() }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { Articulo, CreateArticuloPayload, UpdateArticuloPayload } from '../types/admin-catalog-types'

export const useArticulos = () => {
  return useQuery<Articulo[]>({
    queryKey: queryKeys.adminCatalog.articles.list(),
    queryFn: service.getArticulos,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateArticulo = () => {
  const qc = useQueryClient()
  return useMutation<Articulo, Error, CreateArticuloPayload>({
    mutationFn: service.createArticulo,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.articles.all() }),
  })
}

export const useUpdateArticulo = () => {
  const qc = useQueryClient()
  return useMutation<Articulo, Error, { id: number; data: UpdateArticuloPayload }>({
    mutationFn: ({ id, data }) => service.updateArticulo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.articles.all() }),
  })
}

export const useDeleteArticulo = () => {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: service.deleteArticulo,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.articles.all() }),
  })
}

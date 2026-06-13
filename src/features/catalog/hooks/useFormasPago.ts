import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import * as service from '../services/admin-catalog-service'
import type { FormaPago, CreateFormaPagoPayload, UpdateFormaPagoPayload } from '../types/admin-catalog-types'

export const useFormasPago = () => {
  return useQuery<FormaPago[]>({
    queryKey: queryKeys.adminCatalog.formaPago.list(),
    queryFn: service.getFormasPago,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateFormaPago = () => {
  const qc = useQueryClient()
  return useMutation<FormaPago, Error, CreateFormaPagoPayload>({
    mutationFn: service.createFormaPago,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.formaPago.all() }),
  })
}

export const useUpdateFormaPago = () => {
  const qc = useQueryClient()
  return useMutation<FormaPago, Error, { id: number; data: UpdateFormaPagoPayload }>({
    mutationFn: ({ id, data }) => service.updateFormaPago(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.formaPago.all() }),
  })
}

export const useDeleteFormaPago = () => {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: service.deleteFormaPago,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCatalog.formaPago.all() }),
  })
}

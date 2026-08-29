import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createSucursal } from '../services/sucursales-service'
import type { CreateSucursalPayload, Sucursal } from '../types/sucursal-types'

export const useCreateSucursal = () => {
  const queryClient = useQueryClient()

  return useMutation<Sucursal, Error, CreateSucursalPayload>({
    mutationFn: createSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSucursales.list() })
    },
  })
}

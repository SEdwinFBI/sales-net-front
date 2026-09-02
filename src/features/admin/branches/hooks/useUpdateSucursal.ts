import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { updateSucursal } from '../services/sucursales-service'
import type { Sucursal, UpdateSucursalPayload } from '../types/sucursal-types'

export const useUpdateSucursal = () => {
  const queryClient = useQueryClient()

  return useMutation<Sucursal, Error, UpdateSucursalPayload>({
    mutationFn: updateSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSucursales.list() })
    },
  })
}

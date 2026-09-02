import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { deleteSucursal } from '../services/sucursales-service'

export const useDeleteSucursal = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: deleteSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSucursales.list() })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { deleteUsuario } from '../services/usuarios-service'

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsuarios.list() })
    },
  })
}

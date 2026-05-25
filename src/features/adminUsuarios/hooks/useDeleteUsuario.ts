import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteUsuario } from '../services/usuarios-service'

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios', 'list'] })
    },
  })
}
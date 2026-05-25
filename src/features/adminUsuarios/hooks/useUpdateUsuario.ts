import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUsuario } from '../services/usuarios-service'
import type { UpdateUsuarioPayload } from '../types/usuario-types'

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateUsuarioPayload) => updateUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios', 'list'] })
    },
  })
}
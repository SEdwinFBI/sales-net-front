import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUsuario } from '../services/usuarios-service'
import type { CreateUsuarioPayload } from '../types/usuario-types'

export const useCreateUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUsuarioPayload) => createUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios', 'list'] })
    },
  })
}
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createUsuario } from '../services/usuarios-service'
import type { CreateUsuarioPayload, Usuario } from '../types/usuario-types'

export const useCreateUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation<Usuario, Error, CreateUsuarioPayload>({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsuarios.list() })
    },
  })
}

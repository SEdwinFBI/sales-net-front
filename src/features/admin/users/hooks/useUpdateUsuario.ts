import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { updateUsuario } from '../services/usuarios-service'
import type { UpdateUsuarioPayload, Usuario } from '../types/usuario-types'

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation<Usuario, Error, UpdateUsuarioPayload>({
    mutationFn: updateUsuario,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsuarios.list() })
    },
  })
}

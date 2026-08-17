import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { setAccesoUsuarioSucursal } from '../services/sucursales-service'

export const useSetAccesoUsuarioSucursal = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { idSucursal: number; idUsuario: number; activo: boolean }>({
    mutationFn: ({ idSucursal, idUsuario, activo }) =>
      setAccesoUsuarioSucursal(idSucursal, idUsuario, activo),
    onSuccess: (_data, { idSucursal }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSucursales.detail(idSucursal) })
    },
  })
}

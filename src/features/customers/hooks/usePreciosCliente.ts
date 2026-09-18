import { queryKeys } from '@/lib/query-keys'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/core/store/auth-store'
import {
  getPreciosCliente,
  upsertPreciosCliente,
  deletePrecioCliente,
} from '../services/clientePreciosService'
import type { ClienteVariantePrecioResponse, UpsertPrecioClienteItem } from '../types/customer-prices'
import { toast } from 'sonner'

export const usePreciosCliente = (clienteId: number, sucursalId?: number) => {
  const userSucursalId = useAuthStore((state) => state.user?.sucursalActual?.id)
  const effectiveSucursalId = sucursalId ?? userSucursalId

  return useQuery<ClienteVariantePrecioResponse[]>({
    queryKey: queryKeys.customers.precios(clienteId, effectiveSucursalId),
    queryFn: () => getPreciosCliente(clienteId, effectiveSucursalId),
    enabled: !!clienteId,
  })
}

export const useUpsertPreciosCliente = (clienteId: number, sucursalId?: number) => {
  const queryClient = useQueryClient()
  const userSucursalId = useAuthStore((state) => state.user?.sucursalActual?.id)
  const effectiveSucursalId = sucursalId ?? userSucursalId

  return useMutation({
    mutationFn: (items: UpsertPrecioClienteItem[]) =>
      upsertPreciosCliente(clienteId, items, effectiveSucursalId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.customers.precios(clienteId, effectiveSucursalId), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.precios(clienteId) })
      toast.success('Precios pactados guardados correctamente')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al guardar precios pactados'
      toast.error(msg)
    },
  })
}

export const useDeletePrecioCliente = (clienteId: number, _sucursalId?: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (idVariante: number) => deletePrecioCliente(clienteId, idVariante),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.precios(clienteId) })
      toast.success('Precio pactado eliminado; se usará el precio de catálogo')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al eliminar precio pactado'
      toast.error(msg)
    },
  })
}

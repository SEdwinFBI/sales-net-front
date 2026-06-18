import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/features/core/store/auth-store'
import { createVentaEncabezado } from '../services/clientes-service'
import type { VentaEncabezadoResponse } from '../types/clientes'

const PAGO_MAP: Record<string, number> = { efectivo: 1, credito: 2 }

interface CreateVentaEncabezadoVariables {
  id_cliente: number
  id_forma_pago: number
  estado: 'PENDIENTE' | 'PAGADA' | 'CANCELADA'
  monto: number | string
  observacion?: string | null
}

export const useCreateVentaEncabezado = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation<VentaEncabezadoResponse, Error, CreateVentaEncabezadoVariables>({
    mutationFn: async ({ id_cliente, id_forma_pago, estado, monto, observacion }) => {
      if (!user) throw new Error('Usuario no autenticado')

      const payload = {
        id_usuario: user.id,
        id_cliente,
        id_forma_pago,
        estado,
        monto,
        idempotencia_key: crypto.randomUUID(),
        observacion: observacion || null,
      }

      return createVentaEncabezado(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}

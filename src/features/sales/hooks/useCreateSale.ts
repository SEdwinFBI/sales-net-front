import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createAdminVenta } from '../services/products-service'
import { useAuthStore } from '@/features/core/store/auth-store'
import type { SubmitSalePayload, CreateVentaResponse } from '../types/sales'

const PAGO_MAP: Record<string, number> = { efectivo: 1, credito: 2 }

export const useCreateSale = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation<CreateVentaResponse, Error, SubmitSalePayload>({
    mutationFn: async (payload) => {
      if (!user) throw new Error('Usuario no autenticado')

      return createAdminVenta({
        id_usuario: user.id,
        id_cliente: Number(payload.customerId) || 0,
        id_forma_pago: PAGO_MAP[payload.paymentMethod] || 1,
        estado: payload.paymentMethod === 'credito' ? 'PENDIENTE' : 'PAGADA',
        detalles: payload.items.map((item) => ({
          id_variante: item.variantId,
          cantidad: item.qty,
        })),
      })
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVentas.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.historial() })
    },
  })
}

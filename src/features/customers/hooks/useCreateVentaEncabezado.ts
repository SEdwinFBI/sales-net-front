import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateDebtReports } from '@/lib/query-invalidation'
import { useAuthStore } from '@/features/core/store/auth-store'
import { createVentaEncabezado } from '../services/clientes-service'
import type { VentaEncabezadoResponse } from '../types/clientes'

interface CreateVentaEncabezadoVariables {
  id_sucursal?: number
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
    mutationFn: async ({ id_sucursal, id_cliente, id_forma_pago, estado, monto, observacion }) => {
      if (!user) throw new Error('Usuario no autenticado')
      const sucursalId = user.sucursalActual?.id ?? id_sucursal
      if (!sucursalId) throw new Error('Selecciona la sucursal para registrar la venta')

      const payload = {
        id_sucursal: sucursalId,
        id_cliente,
        id_forma_pago,
        estado,
        total: monto,
        idempotencia_key: crypto.randomUUID(),
        observacion: observacion || null,
      }

      return createVentaEncabezado(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      invalidateDebtReports(queryClient)
    },
  })
}

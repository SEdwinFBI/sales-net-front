import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMovimientoCaja, getCaja, getCajas, getMiCaja } from '../services/cash-service'
import type { CajaFilters } from '../types/cash'

const MI_CAJA_KEY = ['caja', 'mia'] as const

export function useMiCaja() {
  return useQuery({ queryKey: MI_CAJA_KEY, queryFn: getMiCaja })
}

export function useCreateMovimientoCaja() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createMovimientoCaja,
    onSuccess: (caja) => client.setQueryData(MI_CAJA_KEY, caja),
  })
}

export function useCajas(filters: CajaFilters) {
  return useQuery({ queryKey: ['cajas', filters], queryFn: () => getCajas(filters) })
}

export function useCaja(id: number | null) {
  return useQuery({ queryKey: ['caja', id], queryFn: () => getCaja(id!), enabled: id !== null })
}

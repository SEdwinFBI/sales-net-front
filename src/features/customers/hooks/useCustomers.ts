import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../services/clientes-service'
import type { Cliente } from '../types/clientes'

export interface Customer {
  id: string
  name: string
  phone: string
  balance: number
}

export type CustomerSearchParams = {
  search?: string
  activeOnly?: boolean
  pageSize?: 10 | 25 | 50
}

const CUSTOMERS_KEY = ['customers', 'list', 'normalized'] as const

/** Lista de clientes normalizada: id como string, balance coercido a número. */
export const useCustomers = (params: CustomerSearchParams = {}) => {
  const { data, isLoading, isError } = useQuery<{ count: number; results: Cliente[] }, Error, Customer[]>({
    queryKey: [...CUSTOMERS_KEY, params],
    queryFn: () => getClientes(1, params.pageSize ?? 10, params.search ?? '', params.activeOnly),
    staleTime: params.search !== undefined ? 1000 * 60 : 1000 * 60 * 15,
    select: (res) => (res.results ?? []).map((c) => ({
      id: String(c.id),
      name: c.nombre_completo,
      phone: c.telefono,
      balance: Number(c.balance) || 0,
    })),
  })

  return {
    data: data ?? [],
    isLoading,
    isError,
  }
}

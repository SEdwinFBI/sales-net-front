import { useQuery } from "@tanstack/react-query"
import { getCustomers, type CustomerRaw, type CustomerSearchParams } from "../services/customers-service"
import type { Customer } from "../types/customers-types"

const USUARIOS_CUSTOMERS_KEY = ['usuarios', 'customers', 'list'] as const

/** Lista de clientes normalizada: id como string, balance coercido a número. */
export const useCustomers = (params: CustomerSearchParams = {}) => {
    const { data, isLoading, isError } = useQuery<CustomerRaw[], Error, Customer[]>(
        {
            queryKey: [...USUARIOS_CUSTOMERS_KEY, params],
            queryFn: () => getCustomers(params),
            staleTime: params.search !== undefined ? 1000 * 60 : 1000 * 60 * 15,
            select: (raw) => raw.map((c) => ({
                id: String(c.id),
                name: c.nombre_completo,
                phone: c.telefono,
                balance: Number(c.balance) || 0,
            })),
        }
    )

    return {
        data: data ?? [],
        isLoading,
        isError
    }
}

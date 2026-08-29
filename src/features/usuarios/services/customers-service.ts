import { api } from '@/lib/api'

export interface CustomerRaw {
    id: number
    nombre_completo: string
    telefono: string
    balance: number
}

export type CustomerSearchParams = {
    search?: string
    activeOnly?: boolean
    pageSize?: 10 | 25 | 50
}

export const getCustomers = async (params: CustomerSearchParams = {}): Promise<CustomerRaw[]> => {
    const { data } = await api.get<{ status: string; data: { count: number; results: CustomerRaw[] } }>('/admin/clientes/', {
        params: {
            ...(params.search ? { search: params.search } : {}),
            ...(params.activeOnly ? { activo: true } : {}),
            page_size: params.pageSize ?? 10,
        },
    })
    return data.data.results
}

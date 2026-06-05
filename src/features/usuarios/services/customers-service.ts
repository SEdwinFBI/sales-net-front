import { api } from '@/lib/api'

export interface CustomerRaw {
    id: number
    nombre_completo: string
    telefono: string
}

export const getCustomers = async (): Promise<CustomerRaw[]> => {
    const { data } = await api.get<{ status: string; data: { count: number; results: CustomerRaw[] } }>('/admin/clientes/')
    return data.data.results
}
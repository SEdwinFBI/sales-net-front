import { api } from '@/lib/api'
import type { SalesArticlesResponse, SubmitSalePayload, SubmitSaleResponse, ApiResponse, Venta, SalesHistoryFilters } from '../types/sales'

export const getArticles = async (page = 1, pageSize = 10): Promise<SalesArticlesResponse> => {
    const { data } = await api.get<SalesArticlesResponse>('/sales/articles', {
        params: { page, page_size: pageSize },
    })
    return data
}

export const getSalesHistory = async (filters?: SalesHistoryFilters): Promise<ApiResponse<Venta[]>> => {
    const { data } = await api.get<ApiResponse<Venta[]>>('/ventas/historial', {
        params: filters,
    })
    return data
}

export const submitSale = async (payload: SubmitSalePayload): Promise<SubmitSaleResponse> => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (payload.paymentMethod === 'credito' && !payload.customerId) {
            throw new Error('Venta a crédito requiere un cliente')
        }

        return {
            success: true,
            saleId: `VEN-${Date.now()}`,
            message: `Venta por Q${payload.total.toFixed(2)} registrada exitosamente`,
        }
    } catch {
        throw new Error('Error al registrar la venta: ')
    }
}

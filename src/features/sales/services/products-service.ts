
import type { Product, SubmitSalePayload, SubmitSaleResponse, } from '../types/sales'

export const getProducts = async () => {
    try {
        return new Promise<Product[]>(
            (resolve) => setTimeout(() => resolve(import('../mocks/productos').then((module) => module.products)), 2000)
        )
    } catch {
        throw new Error('Error al obtener los productos')
    }
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

import { api } from '@/lib/api'
import type {
  SaveSellerStockPayload,
  StockAssignment,
} from '../types/stock-types'

type ApiResponse<T> = {
  status: 'success' | 'error'
  data: T
}

type StockApi = {
  id: number
  id_variante: number
  id_usuario: number
  cantidad: number
}

const mapStock = (item: StockApi): StockAssignment => ({
  id: item.id,
  sellerId: item.id_usuario,
  variantId: item.id_variante,
  quantity: item.cantidad,
})

const getAllStock = async (): Promise<StockApi[]> => {
  const { data } = await api.get<ApiResponse<StockApi[]>>('/admin/stock/')
  return data.data
}

export const getSellerStock = async (sellerId: number): Promise<StockAssignment[]> => {
  const stock = await getAllStock()
  return stock.filter((item) => item.id_usuario === sellerId).map(mapStock)
}

export const saveSellerStock = async (
  payload: SaveSellerStockPayload
): Promise<StockAssignment[]> => {
  const currentStock = await getAllStock()
  const currentByVariant = new Map(
    currentStock
      .filter((item) => item.id_usuario === payload.sellerId)
      .map((item) => [item.id_variante, item])
  )

  const saved = await Promise.all(
    payload.items.map(async (item) => {
      const existing = currentByVariant.get(item.variantId)

      if (existing) {
        const { data } = await api.put<ApiResponse<StockApi>>(`/admin/stock/${existing.id}/`, {
          cantidad: item.quantity,
        })
        return data.data
      }

      if (item.quantity <= 0) return null

      const { data } = await api.post<ApiResponse<StockApi>>('/admin/stock/', {
        id_variante: item.variantId,
        id_usuario: payload.sellerId,
        cantidad: item.quantity,
      })
      return data.data
    })
  )

  return saved.filter((item): item is StockApi => item !== null).map(mapStock)
}

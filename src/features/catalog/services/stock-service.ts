import { api } from '@/lib/api'
import type {
  SaveSellerStockPayload,
  StockAssignment,
} from '../types/stock-types'

type ApiResponse<T> = {
  status: 'success' | 'error'
  data: T
}

type PaginatedData<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type StockApi = {
  id: number
  id_variante: number
  id_usuario: number
  cantidad: number
}

const normalizeList = <T>(payload: T[] | PaginatedData<T>) =>
  Array.isArray(payload) ? payload : payload.results

const getAllPages = async <T>(url: string): Promise<T[]> => {
  const { data } = await api.get<ApiResponse<T[] | PaginatedData<T>>>(url)
  const firstData = data.data

  if (Array.isArray(firstData)) return firstData
  if (firstData.results.length === 0) return []

  const totalPages = Math.ceil(firstData.count / firstData.results.length)
  const restPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
      api.get<ApiResponse<T[] | PaginatedData<T>>>(url, {
        params: { page: index + 2 },
      })
    )
  )

  return [
    ...firstData.results,
    ...restPages.flatMap((response) => normalizeList(response.data.data)),
  ]
}

const mapStock = (item: StockApi): StockAssignment => ({
  id: item.id,
  sellerId: item.id_usuario,
  variantId: item.id_variante,
  quantity: item.cantidad,
})

/** Stock de UN vendedor filtrado en el servidor (no descarga toda la tabla). */
const getStockDeVendedor = async (sellerId: number): Promise<StockApi[]> => {
  return getAllPages<StockApi>(`/admin/stock/?id_usuario=${sellerId}`)
}

export const getSellerStock = async (sellerId: number): Promise<StockAssignment[]> => {
  const stock = await getStockDeVendedor(sellerId)
  return stock.map(mapStock)
}

export const saveSellerStock = async (
  payload: SaveSellerStockPayload
): Promise<StockAssignment[]> => {
  const currentStock = await getStockDeVendedor(payload.sellerId)
  const currentByVariant = new Map(
    currentStock.map((item) => [item.id_variante, item])
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

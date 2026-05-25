import type {
  SaveSellerStockPayload,
  StockAssignment,
} from '../types/stock-types'

let store: StockAssignment[] = [
  { id: 'stock-2-faja-seda-1', sellerId: '2', variantId: 'faja-seda-1', quantity: 8 },
  { id: 'stock-2-faja-seda-2', sellerId: '2', variantId: 'faja-seda-2', quantity: 5 },
  { id: 'stock-3-faja-colombiana-1', sellerId: '3', variantId: 'faja-colombiana-1', quantity: 3 },
  { id: 'stock-4-blusa-manga-corta-3', sellerId: '4', variantId: 'blusa-manga-corta-3', quantity: 4 },
]

export const getSellerStock = async (sellerId: string): Promise<StockAssignment[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return store.filter((item) => item.sellerId === sellerId)
}

export const saveSellerStock = async (
  payload: SaveSellerStockPayload
): Promise<StockAssignment[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const nextSellerStock = payload.items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      id: `${payload.sellerId}-${item.variantId}`,
      sellerId: payload.sellerId,
      variantId: item.variantId,
      quantity: item.quantity,
    }))

  store = [
    ...store.filter((item) => item.sellerId !== payload.sellerId),
    ...nextSellerStock,
  ]

  return nextSellerStock
}

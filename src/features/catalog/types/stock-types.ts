import type { ArticleSize } from './article-variant-types'

export type StockAssignment = {
  id: number
  sucursalId: number
  variantId: number
  quantity: number
}

export type StockDraftItem = {
  variantId: number
  quantity: number
}

export type SaveSellerStockPayload = {
  sucursalId: number
  items: StockDraftItem[]
}

export type StockSizeColumn = {
  size: ArticleSize
  variantId?: number
  quantity: number
}

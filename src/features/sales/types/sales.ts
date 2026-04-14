export type SalesDialog = 'checkout' | 'clear-cart' | null

export type SaleProduct = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
}

export type CartItem = SaleProduct & {
  qty: number
}

export type SalesDialog = 'checkout' | 'clear-cart' | null

export type ProductVariant = {
  id: number
  size: string
  stock: number
  price: number
}

export type Product = {
  id: number
  name: string
  category: string
  variants: ProductVariant[]
  image: string | null
}

export type CartItem = {
  id: string
  productId: number
  name: string
  category: string
  image: string | null
  variantId: number
  size: string
  price: number
  stock: number
  qty: number
}

export type PaymentMethod = 'efectivo' | 'credito'

export type SubmitSalePayload = {
  id: string
  items: CartItem[]
  paymentMethod: PaymentMethod
  customerId?: string
  total: number
}

export type SubmitSaleResponse = {
  success: boolean
  saleId: string
  message: string
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

export interface SalesArticlesResponse {
  status: 'success'
  data: Product[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
    next: string | null
    previous: string | null
  }
}

export interface Venta {
  id: number
  fecha: string
  total: number
  estado: string
  abonado: number
  saldo: number
  forma_pago: string
  vendedor: {
    id: number
    username: string
    full_name: string
  }
  cliente_info: {
    id: number
    nombre_completo: string
    telefono: string
    balance: number
  }
  detalles: DetalleVenta[]
}

export interface DetalleVenta {
  id: number
  id_variante: number
  id_talla: number
  precio_unitario: number
  cantidad: number
  descuento: number
  monto: number
  articulo: string
  talla: string
}

export interface SalesHistoryFilters {
  fecha_desde?: string
  fecha_hasta?: string
  estado?: string
  id_cliente?: number
}

export interface CreateVentaPayload {
  id_usuario: number
  id_cliente: number
  id_forma_pago: number
  estado: string
  detalles: {
    id_variante: number
    cantidad: number
  }[]
}

export interface CreateVentaResponse {
  status: 'success'
  message: string
  data: {
    id_venta: number
    total: number
    estado: string
  }
}

export interface AdminVentaFilters {
  estado?: string
  page?: number
  page_size?: number
}

export interface VentaListResponse {
  status: 'success'
  data: {
    count: number
    next: string | null
    previous: string | null
    results: Venta[]
  }
}

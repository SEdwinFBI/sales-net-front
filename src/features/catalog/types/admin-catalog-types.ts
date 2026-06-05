export interface Articulo {
  id: number
  titulo: string
  imagen_url: string
  activo: boolean
  fecha_creacion: string
}

export interface CreateArticuloPayload {
  titulo: string
  imagen?: File
}

export interface UpdateArticuloPayload {
  titulo?: string
  imagen?: File
}

export interface Talla {
  id: number
  nombre: string
  activo: boolean
}

export interface CreateTallaPayload {
  nombre: string
}

export interface UpdateTallaPayload {
  nombre?: string
  activo?: boolean
}

export interface Variante {
  id: number
  id_articulo: number
  id_talla: number
  precio_unidad_base: number
  activo: boolean
}

export interface CreateVariantePayload {
  id_articulo: number
  id_talla: number
  precio_unidad_base: number
}

export interface StockItem {
  id: number
  id_variante: number
  id_usuario: number
  cantidad: number
}

export interface CreateStockPayload {
  id_variante: number
  id_usuario: number
  cantidad: number
}

export interface UpdateStockPayload {
  cantidad: number
}

export interface ReglaPrecio {
  id: number
  cantidad_min: number
  cantidad_max: number
  descuento: number
}

export interface CreateReglaPrecioPayload {
  cantidad_min: number
  cantidad_max: number
  descuento: number
}

export interface UpdateReglaPrecioPayload {
  cantidad_min?: number
  cantidad_max?: number
  descuento?: number
}

export interface FormaPago {
  id: number
  nombre: string
  activo: boolean
}

export interface CreateFormaPagoPayload {
  nombre: string
}

export interface UpdateFormaPagoPayload {
  nombre?: string
  activo?: boolean
}

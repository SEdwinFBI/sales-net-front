export interface Cliente {
  id: number
  nombre_completo: string
  direccion: string
  telefono: string
  balance: number
  fecha_notificacion: string
  fecha_creacion: string
  activo: boolean
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

export interface CreateClientePayload {
  nombre_completo: string
  direccion: string
  telefono: string
  balance: number
  fecha_notificacion: string
  activo?: boolean
}

export interface UpdateClientePayload {
  nombre_completo?: string
  direccion?: string
  telefono?: string
  balance?: number
  fecha_notificacion?: string
  activo?: boolean
}

export interface Abono {
  id: number
  monto: number
  fecha_abono: string
  id_venta: number
  venta_total: number
  venta_estado: string
  cliente: {
    id: number
    nombre_completo: string
    balance: number
  }
}

export interface AbonarPayload {
  monto: number
}

export interface AbonarResponse {
  status: 'success'
  data: {
    abono: { id: number; monto: number; fecha_abono: string; id_venta: number }
    balance_restante: number
    venta_estado: string
  }
}

export interface ComprasFilters {
  tipo_pago?: 'credito' | 'efectivo'
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface ComprasData {
  ventas: import('@/features/sales/types/sales').Venta[]
  resumen: {
    total_ventas: number
    total_general: number
    total_pendiente: number
    balance_cliente: number
  }
}

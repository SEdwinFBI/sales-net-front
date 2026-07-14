import type { Venta } from "@/features/sales/types/sales"

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
  fecha_notificacion?: string
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
  saldo_restante: number
  observacion?: string | null
  usuario: {
    id: number
    username: string
    full_name: string
  } | null
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

export interface VentaEncabezadoRequest {
  id_usuario: number
  id_cliente: number
  id_forma_pago: number
  estado: 'PENDIENTE' | 'PAGADA' | 'CANCELADA'
  total: number | string
  idempotencia_key: string
  observacion?: string | null
}

export interface VentaEncabezadoResponse {
  status: string
  message: string
  data: {
    id: number
    id_usuario: number
    id_cliente: number
    id_forma_pago: number
    fecha: string
    total: string
    estado: string
    idempotencia_key: string | null
    observacion: string | null
  }
}

export interface ComprasFilters {
  tipo_pago?: 'credito' | 'efectivo'
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export type TipoMovimiento = 'VENTA_CREDITO' | 'ABONO' | 'CANCELACION' | 'SALDO_INICIAL' | 'AJUSTE'

export interface MovimientoCliente {
  id: number
  tipo: TipoMovimiento
  tipo_display: string
  monto: string
  saldo_anterior: string
  saldo_resultante: string
  fecha: string
  id_venta: number | null
  venta_info: {
    id: number
    total: number
    estado: string
    forma_pago: string
  } | null
  descripcion: string | null
  usuario: {
    id: number
    username: string
    full_name: string
  } | null
}

export interface MovimientosData {
  movimientos: MovimientoCliente[]
  balance_actual: number
}

export interface MovimientosFilters {
  tipo?: TipoMovimiento
  fecha_desde?: string
  fecha_hasta?: string
}

export interface ComprasData {
  ventas: Venta[]
  resumen: {
    total_ventas: number
    total_general: number
    total_pagado: number
    total_abonado: number
    balance: number
  }
}

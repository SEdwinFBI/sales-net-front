export type TipoMovimientoCaja = 'ENTRADA' | 'SALIDA'

export type MovimientoCaja = {
  id: number
  tipo: TipoMovimientoCaja
  tipo_display: string
  monto: string
  observacion: string
  fecha: string
  usuario: { id: number; nombre: string }
}

export type Caja = {
  id: number
  fecha: string
  usuario: { id: number; nombre: string; username: string }
  sucursal: { id: number; nombre: string }
  entradas: string
  salidas: string
  ventas_efectivo: string
  efectivo_esperado: string
  cantidad_movimientos: number
  movimientos?: MovimientoCaja[]
}

export type CajaFilters = {
  fecha_desde?: string
  fecha_hasta?: string
  id_sucursal?: number
  id_usuario?: number
}

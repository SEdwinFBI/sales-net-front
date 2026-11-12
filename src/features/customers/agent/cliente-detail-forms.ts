import { cleanText, positiveInt, positiveNumber } from '@/features/agent/tool-helpers'
import type { Venta } from '@/features/sales/types/sales'

/** Resultado común de validar los valores que propone el modelo para un formulario. */
export type Sanitized<T> = {
  values: Partial<T>
  /** Claves que no son campos del formulario. */
  ignorados: string[]
  errores: string[]
  notas: string[]
}

const empty = <T>(): Sanitized<T> => ({ values: {}, ignorados: [], errores: [], notas: [] })

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// -- Abono -----------------------------------------------------------------------------------

export type AbonoFormValues = { idVenta: number; monto: number; observacion: string }

/** Ventas del cliente a las que se les puede abonar: con saldo pendiente. */
export const ventasConSaldo = (ventas: Venta[]) => ventas.filter((venta) => Number(venta.saldo) > 0)

/**
 * `id_venta` debe ser una venta del cliente con saldo > 0 (la UI solo lista esas), el monto
 * positivo y no mayor al saldo de esa venta.
 */
export function sanitizeAbonoValues(raw: unknown, ventas: Venta[]): Sanitized<AbonoFormValues> {
  const result = empty<AbonoFormValues>()
  if (raw === undefined || raw === null) return result
  if (!isPlainObject(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del abono.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'id_venta': {
        const id = positiveInt(value)
        const venta = id === null ? undefined : ventasConSaldo(ventas).find((v) => v.id === id)
        if (!venta) result.errores.push('id_venta debe ser una venta de este cliente con saldo pendiente (ver leer_compras_cliente).')
        else values.idVenta = venta.id
        break
      }
      case 'monto': {
        const monto = positiveNumber(value)
        if (monto === null) result.errores.push('monto debe ser un numero mayor a 0.')
        else values.monto = monto
        break
      }
      case 'observacion': {
        const text = typeof value === 'string' ? value.trim().slice(0, 500) : null
        if (text === null) result.errores.push('observacion debe ser un texto.')
        else values.observacion = text
        break
      }
      default:
        result.ignorados.push(key)
    }
  }

  const venta = values.idVenta === undefined ? undefined : ventas.find((v) => v.id === values.idVenta)
  if (venta && values.monto !== undefined && values.monto > Number(venta.saldo)) {
    result.notas.push(`El monto (${values.monto}) supera el saldo de la venta (${Number(venta.saldo)}): el usuario debe revisarlo.`)
  }
  return result
}

// -- Ajuste ----------------------------------------------------------------------------------

export type AjusteFormValues = { monto: number; negativo: boolean; descripcion: string }

/** `monto` es la magnitud (> 0); el signo lo da `negativo`, igual que el botón − del diálogo. */
export function sanitizeAjusteValues(raw: unknown): Sanitized<AjusteFormValues> {
  const result = empty<AjusteFormValues>()
  if (raw === undefined || raw === null) return result
  if (!isPlainObject(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del ajuste.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'monto': {
        const monto = positiveNumber(value)
        if (monto === null) result.errores.push('monto debe ser un numero mayor a 0 (usa negativo=true para disminuir el balance).')
        else values.monto = monto
        break
      }
      case 'negativo':
        if (typeof value !== 'boolean') result.errores.push('negativo debe ser true o false.')
        else values.negativo = value
        break
      case 'descripcion': {
        const text = cleanText(value, 500)
        if (text === null) result.errores.push('descripcion debe ser un texto no vacio.')
        else values.descripcion = text
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

// -- Venta del cliente -----------------------------------------------------------------------

export type VentaClienteFormValues = {
  forma_pago: 'efectivo' | 'credito'
  monto: number
  observacion: string
  sucursal_id: number
}

export const FORMAS_PAGO_VENTA = ['efectivo', 'credito'] as const

/**
 * `sucursalIds` son las sucursales activas ya cargadas por el diálogo; si se conocen, `sucursal_id`
 * debe estar entre ellas. Sin lista (el diálogo aún no abre) el id se valida solo como entero.
 */
export function sanitizeVentaClienteValues(
  raw: unknown,
  { sucursalIds }: { sucursalIds?: readonly number[] } = {},
): Sanitized<VentaClienteFormValues> {
  const result = empty<VentaClienteFormValues>()
  if (raw === undefined || raw === null) return result
  if (!isPlainObject(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos de la venta.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'forma_pago':
        if (value !== 'efectivo' && value !== 'credito') result.errores.push("forma_pago debe ser 'efectivo' o 'credito'.")
        else values.forma_pago = value
        break
      case 'monto':
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) result.errores.push('monto debe ser un numero mayor o igual a 0.')
        else values.monto = value
        break
      case 'observacion':
        if (typeof value !== 'string') result.errores.push('observacion debe ser un texto.')
        else values.observacion = value.trim().slice(0, 500)
        break
      case 'sucursal_id': {
        const id = positiveInt(value)
        if (id === null) result.errores.push('sucursal_id debe ser un entero positivo.')
        else if (sucursalIds && !sucursalIds.includes(id)) result.errores.push('sucursal_id no es una sucursal activa disponible.')
        else values.sucursal_id = id
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

import type { DiaNotificacion } from '../types/clientes'

/** Campos del formulario de cliente (ClienteDialog) que el agente puede llenar. */
export type ClienteFormValues = {
  dias_notificacion: DiaNotificacion[]
  permitir_credito: boolean
  nombre_completo: string
  direccion: string
  telefono: string
  balance: number
  activo: boolean
}

/** Orden de aplicación: `permitir_credito` primero, porque de él depende que se muestre el balance. */
export const CLIENTE_FORM_KEYS: ReadonlyArray<keyof ClienteFormValues> = [
  'permitir_credito',
  'nombre_completo',
  'direccion',
  'telefono',
  'balance',
  'dias_notificacion',
  'activo',
]

export type SanitizedClienteValues = {
  values: Partial<ClienteFormValues>
  /** Claves que no son campos del formulario (por ejemplo, intentos de mandar una contraseña). */
  ignorados: string[]
  /** Valores con un tipo o rango inválido. */
  errores: string[]
  /** Reglas del formulario que cambiaron lo pedido. */
  notas: string[]
}

const MAX_TEXT_LENGTH = 200

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, MAX_TEXT_LENGTH)
  return text || null
}

/**
 * Valida los valores que propone el modelo para el formulario de cliente. Solo pasan los
 * campos conocidos con el tipo correcto; el resto se reporta. Aplica las mismas reglas que
 * la UI: sin crédito el balance queda en 0, y con balance distinto de cero el permiso de
 * crédito no se puede cambiar (`creditoBloqueado`).
 */
export function sanitizeClienteValues(
  raw: unknown,
  { creditoBloqueado = false }: { creditoBloqueado?: boolean } = {},
): SanitizedClienteValues {
  const result: SanitizedClienteValues = { values: {}, ignorados: [], errores: [], notas: [] }
  if (raw === undefined || raw === null) return result
  if (!isPlainObject(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del formulario.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'nombre_completo':
      case 'direccion': {
        const text = cleanText(value)
        if (text === null) result.errores.push(`${key} debe ser un texto no vacio.`)
        else values[key] = text
        break
      }
      case 'telefono': {
        const phone = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? String(value) : cleanText(value)
        if (phone === null) result.errores.push('telefono debe ser un texto o numero.')
        else values.telefono = phone
        break
      }
      case 'permitir_credito':
      case 'activo':
        if (typeof value !== 'boolean') result.errores.push(`${key} debe ser true o false.`)
        else values[key] = value
        break
      case 'balance':
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          result.errores.push('balance debe ser un numero mayor o igual a 0.')
        } else {
          values.balance = value
        }
        break
      case 'dias_notificacion': {
        const valid =
          Array.isArray(value) && value.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7)
        if (!valid) result.errores.push('dias_notificacion debe ser una lista de numeros del 1 (lunes) al 7 (domingo).')
        else values.dias_notificacion = [...new Set(value as DiaNotificacion[])].sort((a, b) => a - b)
        break
      }
      default:
        result.ignorados.push(key)
    }
  }

  if (creditoBloqueado && 'permitir_credito' in values) {
    delete values.permitir_credito
    result.notas.push('El permiso de credito no se puede cambiar mientras el balance del cliente no sea cero.')
  }
  if (values.permitir_credito === false && 'balance' in values) {
    delete values.balance
    result.notas.push('Sin credito el balance se guarda en 0, asi que no se aplico el balance.')
  }

  return result
}

import type { ToolResult } from './types'

/** Atajos para armar el resultado de una tool. */
export const ok = (data: unknown): ToolResult => ({ ok: true, data })
export const fail = (error: string): ToolResult => ({ ok: false, error })

/** Esquema de una tool sin argumentos. */
export const NO_PARAMS = { type: 'object', properties: {}, additionalProperties: false } as const

/** Máximo de filas que las tools de lectura (`leer_*`) devuelven al modelo. */
export const MAX_READ_ROWS = 30

export function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** Número finito y mayor que 0 (montos). */
export function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** Texto recortado y no vacío, de a lo sumo `max` caracteres. */
export function cleanText(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, max)
  return text || null
}

/** Fecha real en formato `YYYY-MM-DD`. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export type DateRange = { fecha_desde: string; fecha_hasta: string }

/**
 * Valida un rango de fechas parcial (`fecha_desde` y/o `fecha_hasta`) y lo combina con el actual.
 * Las fechas de los filtros son obligatorias: nunca se aceptan vacías ni se pueden quitar.
 */
export function mergeDateRange(
  args: Record<string, unknown>,
  current: DateRange,
): { range: DateRange } | { error: string } {
  const range = { ...current }
  for (const key of ['fecha_desde', 'fecha_hasta'] as const) {
    if (!(key in args)) continue
    if (!isIsoDate(args[key])) return { error: `${key} debe ser una fecha real en formato AAAA-MM-DD (no se puede dejar vacia).` }
    range[key] = args[key]
  }
  if (range.fecha_desde > range.fecha_hasta) return { error: 'fecha_desde no puede ser posterior a fecha_hasta.' }
  return { range }
}

/** Pasa a minúsculas y sin acentos para comparar nombres de opciones. */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Busca la opción canónica que coincide con el texto (sin distinguir mayúsculas ni acentos). */
export function matchOption(options: readonly string[], value: unknown): string | null {
  if (typeof value !== 'string') return null
  const needle = fold(value)
  return options.find((option) => fold(option) === needle) ?? null
}

/** Primeras `MAX_READ_ROWS` filas, para no inflar lo que se le manda al modelo. */
export function limitRows<T>(rows: readonly T[], max = MAX_READ_ROWS): T[] {
  return rows.slice(0, max)
}

/**
 * Claves que parecen una credencial (contraseña, clave, token, pin, patrón, passkey...). Ninguna
 * tool las acepta: `sanitize*` las descarta y solo reporta el NOMBRE de la clave, nunca su valor.
 */
export function isCredentialKey(key: string): boolean {
  const k = fold(key)
  return /(pass|contras|clave|pwd|secret|token|credencial|patron|passkey)/.test(k) || /(^|[^a-z])pin([^a-z]|$)/.test(k)
}

/** Aviso que acompaña a toda respuesta que descartó una clave tipo credencial. */
export const CREDENTIAL_NOTICE =
  'El asistente no maneja contraseñas, patrones ni passkeys: solo las escribe el usuario.'

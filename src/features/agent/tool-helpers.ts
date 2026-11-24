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

/**
 * Día calendario (`YYYY-MM-DD`) de una fecha del API, en la zona horaria del usuario: la misma que
 * muestra la tabla. Una fecha sin hora se devuelve tal cual; `null` si no es una fecha.
 */
export function localIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export type OptionalDateRange = { fecha_desde?: string; fecha_hasta?: string }

/** Rango opcional de un `leer_*`: cualquiera de los extremos puede faltar (null o vacío = sin límite). */
export function optionalDateRange(args: Record<string, unknown>): { range: OptionalDateRange } | { error: string } {
  const range: OptionalDateRange = {}
  for (const key of ['fecha_desde', 'fecha_hasta'] as const) {
    const value = args[key]
    if (value === undefined || value === null || value === '') continue
    if (!isIsoDate(value)) return { error: `${key} debe ser una fecha real en formato AAAA-MM-DD.` }
    range[key] = value
  }
  if (range.fecha_desde && range.fecha_hasta && range.fecha_desde > range.fecha_hasta) {
    return { error: 'fecha_desde no puede ser posterior a fecha_hasta.' }
  }
  return { range }
}

/** ¿El día cae dentro del rango opcional? Sin fecha válida, solo entra si no hay rango. */
export function inDateRange(day: string | null, range: OptionalDateRange): boolean {
  if (!range.fecha_desde && !range.fecha_hasta) return true
  if (!day) return false
  return (!range.fecha_desde || day >= range.fecha_desde) && (!range.fecha_hasta || day <= range.fecha_hasta)
}

/** Tiempo que da `filtrar_*` a que React pinte los filtros nuevos y arranque la consulta. */
export const FILTER_SETTLE_MS = 80
/** Tope de espera de una consulta tras filtrar. */
export const LOAD_WAIT_MS = 8000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Espera a que la pantalla termine de cargar tras cambiar filtros, para que el `leer_*` siguiente
 * no devuelva los datos del filtro anterior. `isLoading` debe leer el estado vigente (ver
 * `useLiveContext`). Devuelve false si se agotó el tiempo y la consulta sigue en curso.
 */
export async function waitForLoad(
  isLoading: () => boolean,
  { settleMs = FILTER_SETTLE_MS, timeoutMs = LOAD_WAIT_MS, stepMs = 40 } = {},
): Promise<boolean> {
  await sleep(settleMs)
  const deadline = Date.now() + timeoutMs
  while (isLoading()) {
    if (Date.now() >= deadline) return false
    await sleep(stepMs)
  }
  return true
}

/** Mensaje de un `filtrar_*` según haya terminado o no de cargar. */
export function filtersAppliedMessage(readTool: string, loaded: boolean, suffix = ''): string {
  return loaded
    ? `Filtros aplicados y datos cargados. Usa ${readTool} para ver el resultado.${suffix}`
    : `Filtros aplicados, pero los datos aun cargan: espera un momento y llama ${readTool}; si dice cargando, vuelve a llamarla.${suffix}`
}

/** Aviso que acompaña a un `leer_*` cuya pantalla aun carga: sus filas pueden ser las del filtro anterior. */
export function loadingNotice(readTool: string): string {
  return `Los datos aun estan cargando y pueden ser los del filtro anterior: vuelve a llamar ${readTool} en un momento antes de responder.`
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

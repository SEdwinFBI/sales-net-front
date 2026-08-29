/** Fecha de hoy en `YYYY-MM-DD` (hora local, no UTC). */
export function getToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Rango por defecto de los filtros: hoy a hoy. Las fechas son obligatorias,
 * así que nunca se arranca ni se deja el filtro vacío.
 */
export function getTodayRange() {
  const hoy = getToday()
  return { fecha_desde: hoy, fecha_hasta: hoy }
}

/** Rango del mes en curso: del día 1 a hoy. */
export function getDefaultDateRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return { fecha_desde: `${y}-${m}-01`, fecha_hasta: `${y}-${m}-${d}` }
}

const DAY_INITIALS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** Formato visual único de fechas: `dom 23/08/2026`. */
export function formatDisplayDate(value: string | Date) {
  const date = value instanceof Date
    ? value
    : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)

  if (Number.isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${DAY_INITIALS[date.getDay()]} ${day}/${month}/${date.getFullYear()}`
}

/** Conserva la hora después del formato visual estándar. */
export function formatDisplayDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const time = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  return `${formatDisplayDate(date)} ${time}`
}

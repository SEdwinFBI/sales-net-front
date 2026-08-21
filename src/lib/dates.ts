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

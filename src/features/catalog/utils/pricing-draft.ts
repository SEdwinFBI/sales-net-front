import type { MayoreoTier } from '../types/pricing-types'
import { mayoreoTiersSchema, validateTiers, variantPricingRowSchema } from './pricing-schema'

// -- Precios por variante (UserPricingEditor) ---------------------------------------------------

export type TierDraft = { desde: string; hasta: string; descuento: string }

/** Campos editables de la fila de una variante; siempre strings de input (vacío = heredar/default). */
export type DraftRow = {
  precio: string
  tiers: TierDraft[]
  descuentoMayorista: string
}

/** Tope de rangos individuales por variante que acepta el agente. */
const MAX_TIERS = 10
const MAX_MONEY = 1_000_000

export type PriceEditInput = {
  precio?: number | null
  descuento_mayorista?: number | null
  rangos?: { desde: number; hasta?: number | null; descuento: number }[]
}

/** Monto en quetzales con a lo sumo 2 decimales, como exige el schema de la UI. */
function moneyToInput(value: unknown, label: string): { text: string } | { error: string } {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_MONEY) {
    return { error: `${label} debe ser un monto en quetzales entre 0 y ${MAX_MONEY}.` }
  }
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
    return { error: `${label} admite como maximo 2 decimales.` }
  }
  return { text: String(Number(value.toFixed(2))) }
}

export type PriceEditPlan = { row: DraftRow } | { errores: string[] }

/**
 * Arma la fila borrador que resultaría de aplicar los cambios que propone el modelo y la valida
 * con los MISMOS schemas que el botón Guardar (`variantPricingRowSchema` y `validateTiers`).
 * Si algo no valida devuelve los errores y no hay fila: nunca se deja un borrador inválido.
 * `precio` y `descuento_mayorista` aceptan `null` para volver a heredar el valor por defecto.
 */
export function planPriceEdit(
  input: PriceEditInput,
  current: DraftRow,
  precioBase: number,
): PriceEditPlan {
  const errores: string[] = []
  const row: DraftRow = { ...current, tiers: current.tiers.map((tier) => ({ ...tier })) }

  if ('precio' in input) {
    if (input.precio === null) row.precio = ''
    else {
      const money = moneyToInput(input.precio, 'precio')
      if ('error' in money) errores.push(money.error)
      else row.precio = money.text
    }
  }

  if ('descuento_mayorista' in input) {
    if (input.descuento_mayorista === null) row.descuentoMayorista = ''
    else {
      const money = moneyToInput(input.descuento_mayorista, 'descuento_mayorista')
      if ('error' in money) errores.push(money.error)
      else row.descuentoMayorista = money.text
    }
  }

  if ('rangos' in input) {
    const rangos = input.rangos
    if (!Array.isArray(rangos) || rangos.length > MAX_TIERS) {
      errores.push(`rangos debe ser una lista de hasta ${MAX_TIERS} rangos ({desde, hasta?, descuento}).`)
    } else {
      const tiers: TierDraft[] = []
      rangos.forEach((rango, index) => {
        const label = `rangos[${index}]`
        if (typeof rango !== 'object' || rango === null) {
          errores.push(`${label} debe ser un objeto {desde, hasta?, descuento}.`)
          return
        }
        if (!Number.isInteger(rango.desde) || rango.desde < 1) errores.push(`${label}.desde debe ser un entero >= 1.`)
        if (rango.hasta !== undefined && rango.hasta !== null && (!Number.isInteger(rango.hasta) || rango.hasta < 1)) {
          errores.push(`${label}.hasta debe ser un entero >= 1 o estar ausente (sin limite).`)
        }
        const descuento = moneyToInput(rango.descuento, `${label}.descuento`)
        if ('error' in descuento) errores.push(descuento.error)
        else if (Number(descuento.text) <= 0) errores.push(`${label}.descuento debe ser mayor a 0.`)
        else {
          tiers.push({
            desde: String(rango.desde),
            hasta: rango.hasta === undefined || rango.hasta === null ? '' : String(rango.hasta),
            descuento: descuento.text,
          })
        }
      })
      // [] vuelve a la fila inicial vacía que muestra la UI (sin descuento individual).
      row.tiers = tiers.length > 0 ? tiers : [{ desde: '3', hasta: '', descuento: '' }]
    }
  }

  if (errores.length > 0) return { errores }

  // Misma validación que handleSave: solo cuentan los rangos con algo escrito.
  const activeTiers = row.tiers.filter((tier) => tier.descuento !== '' || tier.hasta !== '')
  const parsed = variantPricingRowSchema.safeParse({
    precio: row.precio,
    descuentoMayorista: row.descuentoMayorista,
    precioBase: precioBase,
    tiers: activeTiers,
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [field, index, tierField] = issue.path
      if (field === 'tiers' && typeof index === 'number') {
        errores.push(`rangos[${index}]${tierField ? `.${String(tierField)}` : ''}: ${issue.message}`)
      } else {
        errores.push(`${field === 'descuentoMayorista' ? 'descuento_mayorista' : String(field)}: ${issue.message}`)
      }
    }
  }
  if (activeTiers.length > 0) {
    const tierErrors = validateTiers(activeTiers.map((tier) => ({ desde: tier.desde || '1', hasta: tier.hasta, descuento: tier.descuento })))
    if (tierErrors) {
      for (const [index, message] of Object.entries(tierErrors)) errores.push(`rangos[${index}]: ${message}`)
    }
  }

  return errores.length > 0 ? { errores } : { row }
}

/** Dos filas borrador iguales (incluye rangos): lo que usa la UI para saber si hay cambios. */
export function rowsEqual(a: DraftRow, b: DraftRow): boolean {
  if (a.precio !== b.precio || a.descuentoMayorista !== b.descuentoMayorista) return false
  if (a.tiers.length !== b.tiers.length) return false
  return a.tiers.every(
    (tier, index) =>
      tier.desde === b.tiers[index].desde && tier.hasta === b.tiers[index].hasta && tier.descuento === b.tiers[index].descuento,
  )
}

// -- Mayoreo (MayoreoTiersEditor) ---------------------------------------------------------------

export type TierRow = {
  min: string
  max: string
  sinLimite: boolean
  modo: 'DERIVADO' | 'MONTO_ARTICULO'
  /** Porcentaje (0-100) del descuento individual, como lo muestra el campo. */
  factor: string
}

export const percentToFactor = (value: string) => (value === '' ? '1' : String(Number(value) / 100))

/** Filas del formulario → tiers que se guardan (misma conversión que el botón Guardar). */
export function rowsToTiers(rows: TierRow[]): MayoreoTier[] {
  return rows.map((row) => ({
    unidades_min: Number(row.min),
    unidades_max: row.sinLimite || row.max === '' ? null : Number(row.max),
    factor_individual: percentToFactor(row.factor),
    usar_descuento_articulo: row.modo === 'MONTO_ARTICULO',
  }))
}

export type RangoMayoreoInput = {
  min: number
  max?: number | null
  sin_limite?: boolean
  modo: 'DERIVADO' | 'MONTO_ARTICULO'
  /** Porcentaje 0-100 del descuento individual (solo DERIVADO; por defecto 100). */
  factor?: number
}

const MAX_MAYOREO_ROWS = 10

export type MayoreoPlan = { rows: TierRow[] } | { errores: string[] }

/**
 * Convierte los rangos que propone el modelo en filas del formulario y los valida con
 * `mayoreoTiersSchema` (el mismo schema que el botón Guardar). Devuelve sus mensajes tal cual.
 */
export function planMayoreoRows(rangos: unknown): MayoreoPlan {
  if (!Array.isArray(rangos) || rangos.length === 0 || rangos.length > MAX_MAYOREO_ROWS) {
    return { errores: [`rangos debe ser una lista de 1 a ${MAX_MAYOREO_ROWS} rangos.`] }
  }

  const errores: string[] = []
  const rows: TierRow[] = []
  rangos.forEach((raw, index) => {
    const label = `rangos[${index}]`
    const rango = raw as Partial<RangoMayoreoInput> | null
    if (typeof rango !== 'object' || rango === null) {
      errores.push(`${label} debe ser un objeto.`)
      return
    }
    if (!Number.isInteger(rango.min) || (rango.min as number) < 1) errores.push(`${label}.min debe ser un entero >= 1.`)
    if (rango.modo !== 'DERIVADO' && rango.modo !== 'MONTO_ARTICULO') errores.push(`${label}.modo debe ser 'DERIVADO' o 'MONTO_ARTICULO'.`)
    if (rango.max !== undefined && rango.max !== null && (!Number.isInteger(rango.max) || rango.max < 1)) {
      errores.push(`${label}.max debe ser un entero >= 1 o estar ausente (sin limite).`)
    }
    if (rango.factor !== undefined && (typeof rango.factor !== 'number' || !Number.isFinite(rango.factor))) {
      errores.push(`${label}.factor debe ser un numero (porcentaje 0-100).`)
    }
    if (errores.length > 0) return

    const sinLimite = rango.sin_limite === true || rango.max === undefined || rango.max === null
    rows.push({
      min: String(rango.min),
      max: sinLimite ? '' : String(rango.max),
      sinLimite,
      modo: rango.modo as TierRow['modo'],
      // En MONTO_ARTICULO el factor no se usa: se deja el 100% que el backend ignora.
      factor: rango.modo === 'DERIVADO' && rango.factor !== undefined ? String(rango.factor) : '100',
    })
  })
  if (errores.length > 0) return { errores }

  const validation = mayoreoTiersSchema.safeParse(
    rowsToTiers(rows).map((tier) => ({ ...tier, factor_individual: Number(tier.factor_individual) })),
  )
  if (!validation.success) return { errores: validation.error.issues.map((issue) => issue.message) }
  return { rows }
}

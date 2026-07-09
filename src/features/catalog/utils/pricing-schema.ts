import { z } from 'zod'

const optionalMoney = z
  .string()
  .trim()
  .refine((value) => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0), {
    message: 'Debe ser un monto válido en quetzales (ej. 15.00)',
  })

export const tierRowSchema = z.object({
  desde: z.string().trim().refine(
    (value) => /^\d+$/.test(value) && Number(value) >= 1,
    { message: 'Debe ser un entero ≥ 1' }
  ),
  hasta: z.string().trim(),
  descuento: z.string().trim().refine(
    (value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0,
    { message: 'Debe ser un monto en quetzales > 0' }
  ),
})

export const variantPricingRowSchema = z
  .object({
    precio: optionalMoney,
    descuentoMayorista: optionalMoney,
    precioBase: z.number(),
    tiers: z.array(tierRowSchema),
  })
  .superRefine((row, ctx) => {
    const precioEfectivo = row.precio === '' ? row.precioBase : Number(row.precio)

    // Validate each tier's discount doesn't exceed price
    for (let index = 0; index < row.tiers.length; index += 1) {
      const tier = row.tiers[index]
      const desc = Number(tier.descuento)
      if (desc > precioEfectivo) {
        ctx.addIssue({
          code: 'custom',
          path: ['tiers', index, 'descuento'],
          message: `El descuento (Q${desc.toFixed(2)}) no puede superar el precio (Q${precioEfectivo.toFixed(2)})`,
        })
      }
    }

    // Validate mayoreo descuento
    const descMayorista = row.descuentoMayorista
    if (descMayorista !== '' && Number(descMayorista) > precioEfectivo) {
      ctx.addIssue({
        code: 'custom',
        path: ['descuentoMayorista'],
        message: `El descuento no puede superar el precio (Q${precioEfectivo.toFixed(2)})`,
      })
    }
  })

/**
 * Validate tiers for non-overlapping, ordered, only last open.
 * Returns error strings per index or null if valid.
 */
export function validateTiers(
  tiers: { desde: string; hasta: string; descuento: string }[]
): Record<number, string> | null {
  const errors: Record<number, string> = {}
  const parsed = tiers.map((t, i) => ({
    index: i,
    desde: Number(t.desde),
    hasta: t.hasta === '' ? null : Number(t.hasta),
  }))

  for (const t of parsed) {
    if (t.hasta !== null && t.hasta < t.desde) {
      errors[t.index] = `"Hasta" debe ser ≥ ${t.desde} o estar vacío (sin límite)`
    }
  }

  const sorted = [...parsed].sort((a, b) => a.desde - b.desde)
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]
    const next = sorted[i + 1]

    if (current.hasta === null && next) {
      errors[current.index] = 'Solo el último rango puede quedar sin límite'
    }

    if (next && current.hasta !== null && next.desde <= current.hasta) {
      errors[current.index] = `Se solapa con el rango que inicia en ${next.desde} (tope ${current.hasta})`
    }
  }

  return Object.keys(errors).length > 0 ? errors : null
}

export type VariantPricingRowInput = z.input<typeof variantPricingRowSchema>

export const mayoreoTiersSchema = z
  .array(
    z.object({
      unidades_min: z.number().int().min(1, 'El mínimo de unidades debe ser al menos 1'),
      unidades_max: z.number().int().min(1).nullable(),
      factor_individual: z
        .number()
        .min(0, 'El factor no puede ser negativo')
        .max(1, 'El factor no puede ser mayor a 1'),
      usar_descuento_articulo: z.boolean(),
    })
  )
  .min(1, 'Debe existir al menos un rango')
  .superRefine((tiers, ctx) => {
    const sorted = [...tiers].sort((a, b) => a.unidades_min - b.unidades_min)
    for (let index = 0; index < sorted.length; index += 1) {
      const tier = sorted[index]
      if (tier.unidades_max !== null && tier.unidades_max < tier.unidades_min) {
        ctx.addIssue({
          code: 'custom',
          message: `El rango que inicia en ${tier.unidades_min} tiene un tope menor al mínimo`,
        })
      }
      if (tier.unidades_max === null && index < sorted.length - 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Solo el último rango puede quedar sin límite',
        })
      }
      const next = sorted[index + 1]
      if (next && tier.unidades_max !== null && next.unidades_min <= tier.unidades_max) {
        ctx.addIssue({
          code: 'custom',
          message: `Los rangos se solapan: ${next.unidades_min} choca con el tope ${tier.unidades_max}`,
        })
      }
    }
  })

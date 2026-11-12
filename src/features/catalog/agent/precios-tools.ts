import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, fail, fold, ok, positiveInt } from '@/features/agent/tool-helpers'
import { formatCurrency } from '@/helpers/money'
import type { UserVariantPricing } from '../types/pricing-types'
import {
  planMayoreoRows,
  planPriceEdit,
  rowsEqual,
  type DraftRow,
  type PriceEditInput,
  type TierRow,
} from '../utils/pricing-draft'

export type PreciosTab = 'precios' | 'mayoreo'
const TABS: ReadonlyArray<PreciosTab> = ['precios', 'mayoreo']

/** Lo que PreciosPage le presta al agente cuando ya hay una sucursal elegida. */
export type PreciosPageAgentContext = {
  getTab: () => PreciosTab
  setTab: (tab: PreciosTab) => void
}

/** Tool de las pestañas de Precios y descuentos (solo existe con una sucursal abierta). */
export function buildPreciosPageTools(ctx: PreciosPageAgentContext): AgentToolDef[] {
  return [
    {
      name: 'cambiar_pestana_precios',
      description: "Cambia la pestana de la sucursal abierta: 'precios' (por articulo) o 'mayoreo'.",
      parameters: {
        type: 'object',
        properties: { pestana: { type: 'string', enum: [...TABS] } },
        required: ['pestana'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => (TABS.includes(args.pestana as PreciosTab) ? null : "pestana debe ser 'precios' o 'mayoreo'."),
      run: async (args) => {
        ctx.setTab(args.pestana as PreciosTab)
        return ok({ pestana: args.pestana, estaba_en: ctx.getTab() })
      },
    },
  ]
}

// -- Precios por variante -----------------------------------------------------------------------

/** Lo que UserPricingEditor le presta al agente. */
export type PricingEditorAgentContext = {
  getSucursalName: () => string
  isLoading: () => boolean
  /** Variantes con la configuración guardada en el servidor. */
  getVariants: () => UserVariantPricing[]
  /** Fila borrador de una variante (la del servidor si no se tocó). */
  getRow: (variantId: number) => DraftRow
  getServerRow: (variantId: number) => DraftRow
  dirtyCount: () => number
  /** Escribe la fila en el borrador y expande el artículo. No guarda. */
  setRow: (variantId: number, row: DraftRow, articleId: number) => void
  /** Borra la configuración guardada de la variante en el servidor (mismo flujo que el botón); true si salió bien. */
  resetVariant: (variant: UserVariantPricing) => Promise<boolean>
}

const VARIANTE_ID = { type: 'integer', description: 'variante_id de leer_precios_sucursal.' } as const
const NOT_FOUND = 'No encontre esa variante en esta sucursal (ver leer_precios_sucursal).'

const num = (value: string) => (value === '' ? null : Number(value))

/** Tools de precios por artículo de una sucursal (existen mientras el editor está montado). */
export function buildPricingEditorTools(ctx: PricingEditorAgentContext): AgentToolDef[] {
  const find = (args: Record<string, unknown>) => {
    const id = positiveInt(args.variante_id)
    return id === null ? undefined : ctx.getVariants().find((v) => v.id_variante === id)
  }

  const describeRow = (variant: UserVariantPricing) => {
    const row = ctx.getRow(variant.id_variante)
    return {
      variante_id: variant.id_variante,
      articulo: variant.articulo,
      talla: variant.talla,
      precio_base: variant.precio_base,
      precio: num(row.precio),
      descuento_mayorista: num(row.descuentoMayorista),
      rangos: row.tiers
        .filter((tier) => tier.descuento !== '' || tier.hasta !== '')
        .map((tier) => ({ desde: Number(tier.desde), hasta: num(tier.hasta), descuento: num(tier.descuento) })),
      personalizada: variant.tiene_config,
      modificada: !rowsEqual(row, ctx.getServerRow(variant.id_variante)),
    }
  }

  /** Argumentos de editar_precio_variante → entrada del planificador. */
  const parse = (args: Record<string, unknown>): { variant: UserVariantPricing; input: PriceEditInput } | { error: string } => {
    const variant = find(args)
    if (!variant) return { error: NOT_FOUND }
    const input: PriceEditInput = {}
    if ('precio' in args) input.precio = args.precio as number | null
    if ('descuento_mayorista' in args) input.descuento_mayorista = args.descuento_mayorista as number | null
    if ('rangos' in args) input.rangos = args.rangos as PriceEditInput['rangos']
    if (Object.keys(input).length === 0) return { error: 'Indica al menos un cambio: precio, descuento_mayorista o rangos.' }
    return { variant, input }
  }

  return [
    {
      name: 'leer_precios_sucursal',
      description: `Lee los precios por talla de la sucursal (maximo ${MAX_READ_ROWS} variantes): precio, descuento mayorista y rangos individuales (borrador incluido). Opcional: texto del articulo.`,
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Parte del titulo del articulo.' } },
        additionalProperties: false,
      },
      validar: (args) => ('texto' in args && typeof args.texto !== 'string' ? 'texto debe ser un texto.' : null),
      run: async (args) => {
        const needle = typeof args.texto === 'string' ? fold(args.texto) : ''
        const variants = ctx
          .getVariants()
          .filter((v) => !needle || fold(v.articulo).includes(needle))
          .sort((a, b) => a.articulo.localeCompare(b.articulo) || a.talla.localeCompare(b.talla, undefined, { numeric: true }))
        return ok({
          sucursal: ctx.getSucursalName(),
          cargando: ctx.isLoading(),
          cambios_sin_guardar: ctx.dirtyCount(),
          total: variants.length,
          mostrando: Math.min(variants.length, MAX_READ_ROWS),
          variantes: variants.slice(0, MAX_READ_ROWS).map(describeRow),
        })
      },
    },
    {
      name: 'editar_precio_variante',
      description:
        'Cambia en el BORRADOR el precio, el descuento mayorista (Q; null = heredar) y/o los rangos individuales [{desde, hasta?, descuento}] de una variante. Valida con las reglas del formulario. No guarda: el usuario debe presionar Guardar.',
      parameters: {
        type: 'object',
        properties: {
          variante_id: VARIANTE_ID,
          precio: { type: ['number', 'null'], description: 'Quetzales, 2 decimales; null = precio base.' },
          descuento_mayorista: { type: ['number', 'null'], description: 'Quetzales por unidad; null = heredar.' },
          rangos: {
            type: 'array',
            maxItems: 10,
            description: 'Reemplaza TODOS los rangos individuales; [] los quita.',
            items: {
              type: 'object',
              properties: {
                desde: { type: 'integer', minimum: 1 },
                hasta: { type: ['integer', 'null'], minimum: 1, description: 'Ausente = sin limite (solo el ultimo).' },
                descuento: { type: 'number', exclusiveMinimum: 0, description: 'Quetzales por unidad.' },
              },
              required: ['desde', 'descuento'],
              additionalProperties: false,
            },
          },
        },
        required: ['variante_id'],
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return parsed.error
        const plan = planPriceEdit(parsed.input, ctx.getRow(parsed.variant.id_variante), parsed.variant.precio_base)
        return 'errores' in plan ? plan.errores.join(' ') : null
      },
      run: async (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return fail(parsed.error)
        const { variant, input } = parsed
        const plan = planPriceEdit(input, ctx.getRow(variant.id_variante), variant.precio_base)
        if ('errores' in plan) return fail(plan.errores.join(' '))

        ctx.setRow(variant.id_variante, plan.row, variant.id_articulo)
        return ok({
          sucursal: ctx.getSucursalName(),
          variante: describeRow(variant),
          cambios_sin_guardar: ctx.dirtyCount(),
          mensaje: 'Solo se modifico el borrador. Presiona Guardar para aplicar.',
        })
      },
    },
    {
      name: 'restablecer_precio_variante',
      description:
        'Borra la configuracion GUARDADA de una variante en esta sucursal (vuelve a heredar los valores por defecto). El usuario debe confirmarlo con un clic en el asistente.',
      parameters: {
        type: 'object',
        properties: { variante_id: VARIANTE_ID },
        required: ['variante_id'],
        additionalProperties: false,
      },
      requiere_confirmacion: true,
      validar: (args) => {
        const variant = find(args)
        if (!variant) return NOT_FOUND
        return variant.tiene_config
          ? null
          : `${variant.articulo} talla ${variant.talla} no tiene configuracion guardada: ya hereda los valores por defecto.`
      },
      // El texto sale de la variante real de la lista cargada, nunca de lo que diga el modelo.
      textoConfirmacion: (args) => {
        const variant = find(args)
        return variant
          ? `Restablecer ${variant.articulo} talla ${variant.talla} en ${ctx.getSucursalName()}: se borra su configuracion guardada (precio ${variant.precio_override === null ? 'base' : formatCurrency(variant.precio_override)}) y vuelve a heredar los valores por defecto`
          : ''
      },
      run: async (args) => {
        const variant = find(args)
        if (!variant) return fail(NOT_FOUND)
        return (await ctx.resetVariant(variant))
          ? ok({ restablecida: `${variant.articulo} talla ${variant.talla}`, ahora_hereda: 'valores por defecto' })
          : fail('No se pudo restablecer la variante.')
      },
    },
  ]
}

// -- Mayoreo ------------------------------------------------------------------------------------

/** Lo que MayoreoTiersEditor le presta al agente. */
export type MayoreoEditorAgentContext = {
  getSucursalName: () => string
  isLoading: () => boolean
  getRows: () => TierRow[]
  isDirty: () => boolean
  isDefault: () => boolean
  /** Reemplaza las filas del borrador. No guarda. */
  setRows: (rows: TierRow[]) => void
}

const describeRows = (rows: TierRow[]) =>
  rows.map((row) => ({
    min: Number(row.min),
    max: row.sinLimite || row.max === '' ? null : Number(row.max),
    modo: row.modo,
    ...(row.modo === 'DERIVADO' ? { factor_porcentaje: Number(row.factor) } : {}),
  }))

/** Tools de los rangos de mayoreo (existen mientras la pestaña Mayoreo está montada). */
export function buildMayoreoEditorTools(ctx: MayoreoEditorAgentContext): AgentToolDef[] {
  return [
    {
      name: 'leer_mayoreo',
      description: 'Lee los rangos de mayoreo de la sucursal (borrador incluido): min, max (null = sin limite), modo y factor en porcentaje.',
      parameters: NO_PARAMS,
      run: async () =>
        ok({
          sucursal: ctx.getSucursalName(),
          cargando: ctx.isLoading(),
          es_default: ctx.isDefault(),
          cambios_sin_guardar: ctx.isDirty(),
          rangos: describeRows(ctx.getRows()),
        }),
    },
    {
      name: 'editar_rangos_mayoreo',
      description:
        'Reemplaza en el BORRADOR los rangos de mayoreo: [{min, max?, sin_limite?, modo:DERIVADO|MONTO_ARTICULO, factor?}] (factor = % del descuento individual, 0-100). Valida con las reglas del formulario. No guarda: el usuario debe presionar Guardar cambios.',
      parameters: {
        type: 'object',
        properties: {
          rangos: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: {
              type: 'object',
              properties: {
                min: { type: 'integer', minimum: 1 },
                max: { type: ['integer', 'null'], minimum: 1 },
                sin_limite: { type: 'boolean', description: 'Solo el ultimo rango puede quedar sin limite.' },
                modo: { type: 'string', enum: ['DERIVADO', 'MONTO_ARTICULO'] },
                factor: { type: 'number', minimum: 0, maximum: 100, description: 'Solo DERIVADO; por defecto 100.' },
              },
              required: ['min', 'modo'],
              additionalProperties: false,
            },
          },
        },
        required: ['rangos'],
        additionalProperties: false,
      },
      validar: (args) => {
        const plan = planMayoreoRows(args.rangos)
        return 'errores' in plan ? plan.errores.join(' ') : null
      },
      run: async (args) => {
        const plan = planMayoreoRows(args.rangos)
        if ('errores' in plan) return fail(plan.errores.join(' '))
        ctx.setRows(plan.rows)
        return ok({
          sucursal: ctx.getSucursalName(),
          rangos: describeRows(plan.rows),
          mensaje: 'Solo se modifico el borrador. Presiona Guardar cambios para aplicar.',
        })
      },
    },
  ]
}

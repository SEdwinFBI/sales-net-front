import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, fail, fold, ok, positiveInt } from '@/features/agent/tool-helpers'
import type { Article } from '../types/article-types'
import type { ArticleVariant } from '../types/article-variant-types'

export type SucursalOption = { id: number; nombre: string; activo?: boolean }

/** Lo que una pantalla con lista de sucursales (stock y precios) le presta al agente. */
export type SucursalPickerAgentContext = {
  getSucursales: () => SucursalOption[]
  isLoading: () => boolean
  select: (sucursalId: number) => void
}

type PickerNames = {
  leer: string
  abrir: string
  /** Para las descripciones: "el stock" / "los precios". */
  area: string
}

/**
 * Tools de la lista de sucursales: leerla y abrir una. No hay diálogos en esta pantalla, solo
 * se navega a la sucursal elegida (el editor que se monta registra sus propias tools).
 */
export function buildSucursalPickerTools(ctx: SucursalPickerAgentContext, names: PickerNames): AgentToolDef[] {
  const find = (args: Record<string, unknown>) => {
    const id = positiveInt(args.sucursal_id)
    return id === null ? undefined : ctx.getSucursales().find((s) => s.id === id)
  }

  return [
    {
      name: names.leer,
      description: `Lista las sucursales con su id para abrir ${names.area} de una (maximo ${MAX_READ_ROWS}).`,
      parameters: NO_PARAMS,
      run: async () => {
        const sucursales = ctx.getSucursales()
        return ok({
          cargando: ctx.isLoading(),
          total: sucursales.length,
          sucursales: sucursales.slice(0, MAX_READ_ROWS).map((s) => ({ id: s.id, nombre: s.nombre })),
        })
      },
    },
    {
      name: names.abrir,
      description: `Abre ${names.area} de una sucursal de la lista (por su id). Despues se registran las herramientas de esa pantalla.`,
      parameters: {
        type: 'object',
        properties: { sucursal_id: { type: 'integer', description: `id de ${names.leer}.` } },
        required: ['sucursal_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => (find(args) ? null : `No encontre esa sucursal (ver ${names.leer}).`),
      run: async (args) => {
        const sucursal = find(args)
        if (!sucursal) return fail('No encontre esa sucursal.')
        ctx.select(sucursal.id)
        return ok({ mensaje: `Abierto ${names.area} de ${sucursal.nombre}.` })
      },
    },
  ]
}

// -- Editor de stock ----------------------------------------------------------------------------

export type StockChange = {
  variantId: number
  articleId: number
  articulo: string
  talla: string
  /** Lo que hay guardado en el servidor. */
  guardado: number
  /** Lo que tenía el borrador antes de este cambio. */
  borradorAntes: number
  cantidad: number
}

const MAX_CHANGES = 50
const MAX_QUANTITY = 1_000_000

export type StockPlan = { changes: StockChange[] } | { errores: string[] }

/**
 * Valida `cambios: [{variante_id, cantidad}]` contra las variantes de la sucursal. Todo o nada:
 * una cantidad entera >= 0, variantes que existan y sin repetir.
 */
export function planStockChanges(
  raw: unknown,
  variants: ArticleVariant[],
  articles: Article[],
  quantities: { saved: (variantId: number) => number; draft: (variantId: number) => number },
): StockPlan {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_CHANGES) {
    return { errores: [`cambios debe ser una lista de 1 a ${MAX_CHANGES} elementos {variante_id, cantidad}.`] }
  }

  const byId = new Map(variants.map((variant) => [variant.id, variant]))
  const titles = new Map(articles.map((article) => [article.id, article.title]))
  const errores: string[] = []
  const seen = new Set<number>()
  const changes: StockChange[] = []

  raw.forEach((item, index) => {
    const label = `cambios[${index}]`
    const entry = item as { variante_id?: unknown; cantidad?: unknown } | null
    if (typeof entry !== 'object' || entry === null) {
      errores.push(`${label} debe ser un objeto {variante_id, cantidad}.`)
      return
    }
    const variantId = positiveInt(entry.variante_id)
    const variant = variantId === null ? undefined : byId.get(variantId)
    if (!variant || variantId === null) {
      errores.push(`${label}.variante_id no es una variante de este catalogo (ver leer_stock).`)
      return
    }
    if (seen.has(variantId)) {
      errores.push(`${label}: la variante ${variantId} esta repetida.`)
      return
    }
    seen.add(variantId)
    const cantidad = entry.cantidad
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > MAX_QUANTITY) {
      errores.push(`${label}.cantidad debe ser un entero entre 0 y ${MAX_QUANTITY}.`)
      return
    }
    changes.push({
      variantId,
      articleId: variant.articleId,
      articulo: titles.get(variant.articleId) ?? `Articulo ${variant.articleId}`,
      talla: variant.size,
      guardado: quantities.saved(variantId),
      borradorAntes: quantities.draft(variantId),
      cantidad,
    })
  })

  return errores.length > 0 ? { errores } : { changes }
}

/** Lo que SellerStockEditor le presta al agente. */
export type StockEditorAgentContext = {
  getSucursalName: () => string
  isLoading: () => boolean
  getArticles: () => Article[]
  getVariants: () => ArticleVariant[]
  /** Cantidad guardada en el servidor. */
  getSaved: (variantId: number) => number
  /** Cantidad del borrador (la guardada si no se tocó). */
  getDraft: (variantId: number) => number
  /** Hay cantidades del borrador distintas de las guardadas. */
  hasUnsavedChanges: () => boolean
  /** Escribe las cantidades en el borrador y expande esos artículos. No guarda. */
  applyDraft: (changes: { variantId: number; cantidad: number }[], articleIds: number[]) => void
  goBack: () => void
}

/** Tools de la edición de stock de una sucursal (existen mientras el editor está montado). */
export function buildStockEditorTools(ctx: StockEditorAgentContext): AgentToolDef[] {
  const quantities = { saved: ctx.getSaved, draft: ctx.getDraft }

  return [
    {
      name: 'leer_stock',
      description: `Lee el stock de la sucursal por articulo y talla (maximo ${MAX_READ_ROWS} variantes): cantidad guardada y del borrador. Opcional: texto para filtrar por titulo.`,
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Parte del titulo del articulo.' } },
        additionalProperties: false,
      },
      validar: (args) => ('texto' in args && typeof args.texto !== 'string' ? 'texto debe ser un texto.' : null),
      run: async (args) => {
        const needle = typeof args.texto === 'string' ? fold(args.texto) : ''
        const variants = ctx.getVariants()
        let remaining = MAX_READ_ROWS
        const articulos: unknown[] = []
        const sorted = [...ctx.getArticles()].sort((a, b) => a.title.localeCompare(b.title))
        for (const article of sorted) {
          if (needle && !fold(article.title).includes(needle)) continue
          const own = variants
            .filter((v) => v.articleId === article.id)
            .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }))
          if (own.length === 0 || remaining <= 0) continue
          const shown = own.slice(0, remaining)
          remaining -= shown.length
          articulos.push({
            articulo_id: article.id,
            articulo: article.title,
            variantes: shown.map((v) => ({
              variante_id: v.id,
              talla: v.size,
              guardado: ctx.getSaved(v.id),
              borrador: ctx.getDraft(v.id),
            })),
          })
        }
        return ok({
          sucursal: ctx.getSucursalName(),
          cargando: ctx.isLoading(),
          cambios_sin_guardar: ctx.hasUnsavedChanges(),
          articulos,
        })
      },
    },
    {
      name: 'editar_stock',
      description:
        'Cambia en el BORRADOR la cantidad de variantes: cambios=[{variante_id, cantidad}] (entero >= 0). No guarda: el usuario debe presionar Guardar.',
      parameters: {
        type: 'object',
        properties: {
          cambios: {
            type: 'array',
            maxItems: MAX_CHANGES,
            items: {
              type: 'object',
              properties: { variante_id: { type: 'integer' }, cantidad: { type: 'integer', minimum: 0 } },
              required: ['variante_id', 'cantidad'],
              additionalProperties: false,
            },
          },
        },
        required: ['cambios'],
        additionalProperties: false,
      },
      validar: (args) => {
        const plan = planStockChanges(args.cambios, ctx.getVariants(), ctx.getArticles(), quantities)
        return 'errores' in plan ? plan.errores.join(' ') : null
      },
      run: async (args) => {
        const plan = planStockChanges(args.cambios, ctx.getVariants(), ctx.getArticles(), quantities)
        if ('errores' in plan) return fail(plan.errores.join(' '))

        ctx.applyDraft(
          plan.changes.map((change) => ({ variantId: change.variantId, cantidad: change.cantidad })),
          [...new Set(plan.changes.map((change) => change.articleId))],
        )

        // Bajar la cantidad guardada no es un resurtido: el servidor lo registra como AJUSTE de inventario.
        const bajan = plan.changes.filter((change) => change.cantidad < change.guardado)
        return ok({
          sucursal: ctx.getSucursalName(),
          aplicado: plan.changes.map((change) => ({
            variante_id: change.variantId,
            articulo: change.articulo,
            talla: change.talla,
            guardado: change.guardado,
            borrador: change.cantidad,
          })),
          ...(bajan.length > 0
            ? {
                aviso: `Esto generara un AJUSTE de inventario: ${bajan
                  .map((c) => `${c.articulo} talla ${c.talla} baja de ${c.guardado} a ${c.cantidad}`)
                  .join('; ')}.`,
              }
            : {}),
          mensaje: 'Solo se modifico el borrador. Presiona Guardar para aplicar.',
        })
      },
    },
    {
      name: 'volver_stock',
      description: 'Vuelve a la lista de sucursales del stock. Falla si hay cambios sin guardar en el borrador (el usuario debe guardarlos o descartarlos).',
      parameters: NO_PARAMS,
      abreUi: true,
      validar: () =>
        ctx.hasUnsavedChanges()
          ? 'Hay cambios sin guardar en el borrador de stock: el usuario debe presionar Guardar (o volver el mismo para descartarlos).'
          : null,
      run: async () => {
        ctx.goBack()
        return ok({ mensaje: 'Volviste a la lista de sucursales.' })
      },
    },
  ]
}

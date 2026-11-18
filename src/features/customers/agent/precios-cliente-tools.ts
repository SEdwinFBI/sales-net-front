import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, fail, limitRows, ok, positiveInt, positiveNumber } from '@/features/agent/tool-helpers'
import { formatCurrency } from '@/helpers/money'
import type { ClienteVariantePrecioResponse } from '../types/customer-prices'

export type VistaPrecios = 'todos' | 'personalizados' | 'catalogo'
export type PreciosFilters = { texto: string; vista: VistaPrecios }

const VISTAS: ReadonlyArray<VistaPrecios> = ['todos', 'personalizados', 'catalogo']

/** Lo que PreciosClienteTable le presta al agente (en la ficha del cliente y en /precios). */
export type PreciosClienteAgentContext = {
  getCustomerName: () => string
  /** Todas las variantes cargadas (sin filtros). */
  getVariants: () => ClienteVariantePrecioResponse[]
  /** Las que quedan tras los filtros de la tabla. */
  getFiltered: () => ClienteVariantePrecioResponse[]
  getFilters: () => PreciosFilters
  setFilters: (filters: Partial<PreciosFilters>) => void
  /** El diálogo de edición de precio está abierto. */
  isDialogOpen: () => boolean
  openEdit: (variant: ClienteVariantePrecioResponse, precio?: number) => void
  /** Elimina el precio personalizado (mismo flujo que el botón de la papelera). Lanza si falla. */
  deletePrecio: (variant: ClienteVariantePrecioResponse) => Promise<void>
}

const FILL_TOOL = 'llenar_precio_cliente'
const VARIANTE_ID = { type: 'integer', description: 'variante_id de leer_precios_cliente.' } as const

const describeVariant = (v: ClienteVariantePrecioResponse) => `${v.articulo} talla ${v.talla}`

/**
 * Tools de la tabla de precios del cliente. Solo el admin puede editar o eliminar precios
 * (igual que los botones de la UI); el resto solo filtra y lee.
 */
export function buildPreciosClienteTools(ctx: PreciosClienteAgentContext, isAdmin: boolean): AgentToolDef[] {
  const findVariant = (args: Record<string, unknown>) => {
    const id = positiveInt(args.variante_id)
    return id === null ? undefined : ctx.getVariants().find((v) => v.id_variante === id)
  }

  const tools: AgentToolDef[] = [
    {
      name: 'filtrar_precios_cliente',
      description:
        'Filtra la tabla de precios del cliente por texto (articulo, talla o SKU) y vista (todos, personalizados, catalogo). Despues usa leer_precios_cliente.',
      parameters: {
        type: 'object',
        properties: {
          texto: { type: 'string', description: 'Vacio para quitar el filtro de texto.' },
          vista: { type: 'string', enum: [...VISTAS] },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        if (!('texto' in args) && !('vista' in args)) return 'Indica al menos un filtro: texto o vista.'
        if ('texto' in args && typeof args.texto !== 'string') return 'texto debe ser un texto (vacio para quitar el filtro).'
        if ('vista' in args && !VISTAS.includes(args.vista as VistaPrecios)) return "vista debe ser 'todos', 'personalizados' o 'catalogo'."
        return null
      },
      run: async (args) => {
        const filters: Partial<PreciosFilters> = {}
        if ('texto' in args) filters.texto = String(args.texto).trim().slice(0, 100)
        if ('vista' in args) filters.vista = args.vista as VistaPrecios
        ctx.setFilters(filters)
        return ok({ filtros: { ...ctx.getFilters(), ...filters }, mensaje: 'Filtros aplicados. Usa leer_precios_cliente para ver el resultado.' })
      },
    },
    {
      name: 'leer_precios_cliente',
      description: `Lista los precios del cliente tras los filtros (maximo ${MAX_READ_ROWS}): variante_id, articulo, talla, precio de catalogo, precio del cliente y si es personalizado.`,
      parameters: NO_PARAMS,
      run: async () => {
        const all = ctx.getVariants()
        const filtered = ctx.getFiltered()
        return ok({
          cliente: ctx.getCustomerName(),
          filtros: ctx.getFilters(),
          total: all.length,
          personalizados: all.filter((v) => v.tiene_config).length,
          coinciden: filtered.length,
          mostrando: Math.min(filtered.length, MAX_READ_ROWS),
          precios: limitRows(filtered).map((v) => ({
            variante_id: v.id_variante,
            articulo: v.articulo,
            talla: v.talla,
            ...(v.sku ? { sku: v.sku } : {}),
            precio_catalogo: v.precio_base,
            precio_cliente: v.tiene_config ? v.precio_cliente : null,
            personalizado: v.tiene_config,
          })),
        })
      },
    },
  ]

  if (!isAdmin) return tools

  tools.push(
    {
      name: 'abrir_editar_precio_cliente',
      description:
        'Abre el dialogo para asignar o editar el precio de una variante para este cliente, opcionalmente con un precio inicial. No guarda: el usuario presiona el boton.',
      parameters: {
        type: 'object',
        properties: { variante_id: VARIANTE_ID, precio: { type: 'number', exclusiveMinimum: 0, description: 'Precio inicial en quetzales.' } },
        required: ['variante_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError(FILL_TOOL)
        if (!findVariant(args)) return 'No encontre esa variante entre las del cliente (ver leer_precios_cliente).'
        if ('precio' in args && positiveNumber(args.precio) === null) return 'precio debe ser un numero mayor a 0.'
        return null
      },
      run: async (args) => {
        const variant = findVariant(args)
        if (!variant) return fail('No encontre esa variante.')
        const precio = 'precio' in args ? (positiveNumber(args.precio) ?? undefined) : undefined
        ctx.openEdit(variant, precio)
        return ok({
          mensaje: `Dialogo de precio de ${describeVariant(variant)} abierto${precio ? ` con ${formatCurrency(precio)}` : ''}. El usuario debe revisarlo y guardar.`,
        })
      },
    },
    {
      name: 'eliminar_precio_cliente',
      description:
        'Elimina el precio personalizado de una variante para este cliente (vuelve al de catalogo). El usuario debe confirmarlo con un clic en el asistente.',
      parameters: {
        type: 'object',
        properties: { variante_id: VARIANTE_ID },
        required: ['variante_id'],
        additionalProperties: false,
      },
      requiere_confirmacion: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const variant = findVariant(args)
        if (!variant) return 'No encontre esa variante entre las del cliente (ver leer_precios_cliente).'
        if (!variant.tiene_config) return `${describeVariant(variant)} no tiene precio personalizado: ya usa el de catalogo.`
        return null
      },
      // El texto sale de la variante real de la lista cargada, nunca de lo que diga el modelo.
      textoConfirmacion: (args) => {
        const variant = findVariant(args)
        return variant
          ? `Eliminar el precio personalizado de ${describeVariant(variant)} para ${ctx.getCustomerName()} (volvera al de catalogo: ${formatCurrency(variant.precio_base)})`
          : ''
      },
      run: async (args) => {
        const variant = findVariant(args)
        if (!variant) return fail('No encontre esa variante.')
        try {
          await ctx.deletePrecio(variant)
        } catch {
          return fail('No se pudo eliminar el precio.')
        }
        return ok({ eliminado: describeVariant(variant), ahora_usa: 'precio de catalogo' })
      },
    },
  )

  return tools
}

/** Lo que EditCustomerPriceDialog le presta al agente mientras está abierto. */
export type PrecioDialogAgentContext = {
  getVariant: () => ClienteVariantePrecioResponse | null
  getPrecio: () => string
  setPrecio: (precio: string) => void
}

/** Tool que existe mientras el diálogo de precio del cliente está abierto. No guarda: el usuario presiona el botón. */
export function buildPrecioDialogTools(ctx: PrecioDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: FILL_TOOL,
      description:
        'Cambia el precio del cliente en el dialogo de precio abierto (en quetzales, mayor a 0). No guarda: el usuario presiona el boton.',
      parameters: {
        type: 'object',
        properties: { precio: { type: 'number', exclusiveMinimum: 0 } },
        required: ['precio'],
        additionalProperties: false,
      },
      validar: (args) => (positiveNumber(args.precio) === null ? 'precio debe ser un numero mayor a 0.' : null),
      run: async (args) => {
        const precio = positiveNumber(args.precio)
        const variant = ctx.getVariant()
        if (precio === null || !variant) return fail('No hay un precio abierto para llenar.')
        ctx.setPrecio(String(precio))
        return ok({
          aplicado: { precio },
          articulo: describeVariant(variant),
          precio_catalogo: variant.precio_base,
          mensaje: 'Precio llenado. El usuario debe revisarlo y presionar el boton para guardar.',
        })
      },
    },
  ]
}

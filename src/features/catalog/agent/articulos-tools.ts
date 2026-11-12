import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  MAX_READ_ROWS,
  NO_PARAMS,
  cleanText,
  fail,
  limitRows,
  matchOption,
  ok,
  positiveInt,
  positiveNumber,
} from '@/features/agent/tool-helpers'
import type { ToolResult } from '@/features/agent/types'
import type { Article } from '../types/article-types'

/** Tallas con las que se crea un artículo nuevo (el diálogo las fija). */
export const DEFAULT_SIZES = ['1', '2', '3', '4', '5', '6'] as const

export type ArticuloFormValues = {
  titulo: string
  /** Precio base por talla (clave = talla). */
  precios: Record<string, number>
}

export type SanitizedArticulo = {
  values: Partial<ArticuloFormValues>
  ignorados: string[]
  errores: string[]
}

const MAX_TITLE = 150

/**
 * Valida el título y los precios por talla que propone el modelo. `sizes` son las tallas que el
 * formulario muestra (las 6 por defecto al crear; las del artículo al editar).
 */
export function sanitizeArticuloValues(raw: unknown, sizes: readonly string[]): SanitizedArticulo {
  const result: SanitizedArticulo = { values: {}, ignorados: [], errores: [] }
  if (raw === undefined || raw === null) return result
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del articulo.')
    return result
  }

  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'titulo': {
        const titulo = cleanText(value, MAX_TITLE)
        if (titulo === null) result.errores.push('titulo debe ser un texto no vacio.')
        else result.values.titulo = titulo
        break
      }
      case 'precios': {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          result.errores.push('precios debe ser un objeto {talla: precio}.')
          break
        }
        const precios: Record<string, number> = {}
        for (const [talla, precio] of Object.entries(value)) {
          const size = matchOption(sizes, talla)
          if (!size) result.errores.push(`La talla ${talla} no existe en este formulario (tallas: ${sizes.join(', ')}).`)
          else if (positiveNumber(precio) === null) result.errores.push(`El precio de la talla ${talla} debe ser un numero mayor a 0.`)
          else precios[size] = precio as number
        }
        if (Object.keys(precios).length > 0) result.values.precios = precios
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

/** Lo que ArticlesGrid le presta al agente. */
export type ArticulosAgentContext = {
  getFilters: () => { texto: string; talla: string; estado_tallas: 'todos' | 'con_tallas' | 'sin_tallas' }
  setFilters: (filters: Partial<{ texto: string; talla: string; estado_tallas: 'todos' | 'con_tallas' | 'sin_tallas' }>) => void
  /** Tallas que existen en el catálogo (opciones del filtro). */
  getSizes: () => string[]
  isLoading: () => boolean
  /** Artículos tras los filtros, con sus tallas y precios. */
  getFiltered: () => { article: Article; tallas: { talla: string; precio: number }[] }[]
  getArticle: (id: number) => Article | undefined
  /** Tallas de un artículo (las que muestra su formulario de edición). */
  getArticleSizes: (id: number) => string[]
  /** El formulario de artículo (nuevo o edición) está abierto. */
  isDialogOpen: () => boolean
  /** La confirmación de eliminar está abierta. */
  isDeleteOpen: () => boolean
  openNew: (valores?: Partial<ArticuloFormValues>) => void
  openEdit: (article: Article, valores?: Partial<ArticuloFormValues>) => void
  openDelete: (article: Article) => void
  /** Navega a /catalogo/precios?articulo=<id>, igual que el botón de la tarjeta. */
  goToPrecios: (articleId: number) => void
}

const FILL_TOOL = 'llenar_formulario_articulo'
const ESTADOS = ['todos', 'con_tallas', 'sin_tallas'] as const

const VALORES_SCHEMA = {
  type: 'object',
  description: 'Campos del formulario a precargar.',
  properties: {
    titulo: { type: 'string' },
    precios: {
      type: 'object',
      description: 'Precio base por talla, ej. {"1": 125, "2": 130}.',
      additionalProperties: { type: 'number', exclusiveMinimum: 0 },
    },
  },
  additionalProperties: false,
} as const

const ARTICULO_ID = { type: 'integer', description: 'articulo_id de leer_articulos.' } as const

const IMAGE_NOTICE =
  'La imagen del articulo la selecciona el usuario con el campo de archivo del formulario; el asistente no puede subirla.'

/** Tools de /catalogo/productos. Ninguna guarda ni elimina: abren el formulario o la confirmación. */
export function buildArticulosTools(ctx: ArticulosAgentContext): AgentToolDef[] {
  const dialogGuard = (fill?: string) =>
    ctx.isDialogOpen() ? dialogAlreadyOpenError(fill) : ctx.isDeleteOpen() ? dialogAlreadyOpenError() : null

  /** Valida los argumentos de filtrar_articulos y los traduce a un cambio de filtros. */
  type FilterChange = Parameters<ArticulosAgentContext['setFilters']>[0]
  const parseFilters = (args: Record<string, unknown>): { filters: FilterChange } | { error: string } => {
    if (!('texto' in args) && !('talla' in args) && !('estado_tallas' in args)) {
      return { error: 'Indica al menos un filtro: texto, talla o estado_tallas.' }
    }
    const filters: FilterChange = {}
    if ('texto' in args) {
      if (typeof args.texto !== 'string') return { error: 'texto debe ser un texto (vacio para quitar el filtro).' }
      filters.texto = args.texto.trim().slice(0, 100)
    }
    if ('talla' in args) {
      const raw = typeof args.talla === 'string' ? args.talla.trim() : args.talla
      if (raw === 'todas' || raw === 'all' || raw === '') filters.talla = 'all'
      else {
        const sizes = ctx.getSizes()
        const size = matchOption(sizes, typeof raw === 'number' ? String(raw) : raw)
        if (!size) return { error: `talla no valida. Opciones: ${sizes.join(', ') || 'ninguna'} (o 'todas').` }
        filters.talla = size
      }
    }
    if ('estado_tallas' in args) {
      if (!ESTADOS.includes(args.estado_tallas as (typeof ESTADOS)[number])) {
        return { error: "estado_tallas debe ser 'todos', 'con_tallas' o 'sin_tallas'." }
      }
      filters.estado_tallas = args.estado_tallas as (typeof ESTADOS)[number]
    }
    return { filters }
  }

  const findArticle = (args: Record<string, unknown>) => {
    const id = positiveInt(args.articulo_id)
    return id === null ? undefined : ctx.getArticle(id)
  }
  const NOT_FOUND = 'No encontre ese articulo (ver leer_articulos).'

  return [
    {
      name: 'filtrar_articulos',
      description: 'Filtra los articulos del catalogo por texto (titulo), talla y estado de tallas (todos, con_tallas, sin_tallas). Despues usa leer_articulos.',
      parameters: {
        type: 'object',
        properties: {
          texto: { type: 'string', description: 'Vacio para quitar el filtro.' },
          talla: { type: 'string', description: "Una talla del catalogo, o 'todas'." },
          estado_tallas: { type: 'string', enum: [...ESTADOS] },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parseFilters(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parseFilters(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters(parsed.filters)
        return ok({ filtros: { ...ctx.getFilters(), ...parsed.filters }, mensaje: 'Filtros aplicados. Usa leer_articulos para ver el resultado.' })
      },
    },
    {
      name: 'leer_articulos',
      description: `Lista los articulos del catalogo tras los filtros (maximo ${MAX_READ_ROWS}): id, titulo y sus tallas con precio base.`,
      parameters: NO_PARAMS,
      run: async () => {
        const filtered = ctx.getFiltered()
        return ok({
          filtros: ctx.getFilters(),
          tallas_del_catalogo: ctx.getSizes(),
          cargando: ctx.isLoading(),
          total: filtered.length,
          mostrando: Math.min(filtered.length, MAX_READ_ROWS),
          articulos: limitRows(filtered).map(({ article, tallas }) => ({
            id: article.id,
            titulo: article.title,
            tallas,
            ...(tallas.length > 0 ? { precio_desde: Math.min(...tallas.map((t) => t.precio)) } : {}),
          })),
        })
      },
    },
    {
      name: 'abrir_nuevo_articulo',
      description:
        'Abre el formulario de nuevo articulo, opcionalmente con titulo y precios por talla (1 a 6). La imagen la elige el usuario. No guarda: el usuario presiona Crear articulo.',
      parameters: { type: 'object', properties: { valores: VALORES_SCHEMA }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const { errores } = sanitizeArticuloValues(args.valores, DEFAULT_SIZES)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const { values, ignorados } = sanitizeArticuloValues(args.valores, DEFAULT_SIZES)
        ctx.openNew(Object.keys(values).length ? values : undefined)
        return ok({
          mensaje: 'Formulario de nuevo articulo abierto. El usuario debe revisarlo y presionar Crear articulo.',
          imagen: IMAGE_NOTICE,
          precargado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
        })
      },
    },
    {
      name: 'abrir_editar_articulo',
      description:
        'Abre el formulario de edicion de un articulo, opcionalmente con titulo y precios por talla nuevos. No guarda: el usuario presiona Guardar cambios.',
      parameters: {
        type: 'object',
        properties: { articulo_id: ARTICULO_ID, valores: VALORES_SCHEMA },
        required: ['articulo_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const article = findArticle(args)
        if (!article) return NOT_FOUND
        const { errores } = sanitizeArticuloValues(args.valores, ctx.getArticleSizes(article.id))
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const article = findArticle(args)
        if (!article) return fail(NOT_FOUND)
        const { values, ignorados } = sanitizeArticuloValues(args.valores, ctx.getArticleSizes(article.id))
        ctx.openEdit(article, Object.keys(values).length ? values : undefined)
        return ok({
          mensaje: `Formulario de ${article.title} abierto. El usuario debe revisarlo y presionar Guardar cambios.`,
          imagen: 'La imagen es opcional al editar; si quiere cambiarla, la elige el usuario.',
          precargado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
        })
      },
    },
    {
      name: 'abrir_eliminar_articulo',
      description: 'Abre la confirmacion existente para eliminar un articulo. No elimina: el usuario presiona Eliminar (no se puede deshacer).',
      parameters: {
        type: 'object',
        properties: { articulo_id: ARTICULO_ID },
        required: ['articulo_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        return findArticle(args) ? null : NOT_FOUND
      },
      run: async (args) => {
        const article = findArticle(args)
        if (!article) return fail(NOT_FOUND)
        ctx.openDelete(article)
        return ok({ mensaje: `Confirmacion para eliminar ${article.title} abierta. El usuario debe presionar Eliminar.` })
      },
    },
    {
      name: 'ir_a_precios_articulo',
      description: 'Va a Precios y descuentos enfocado en un articulo (igual que el boton de la tarjeta). Despues hay que elegir la sucursal.',
      parameters: {
        type: 'object',
        properties: { articulo_id: ARTICULO_ID },
        required: ['articulo_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        return findArticle(args) ? null : NOT_FOUND
      },
      run: async (args) => {
        const article = findArticle(args)
        if (!article) return fail(NOT_FOUND)
        ctx.goToPrecios(article.id)
        return ok({
          mensaje: `Navegando a Precios y descuentos con ${article.title}.`,
          aviso: 'La pantalla pide elegir primero la sucursal (con abrir_precios_sucursal); al elegirla se pierde el enfoque en el articulo.',
        })
      },
    },
  ]
}

/** Lo que ArticleDialog le presta al agente mientras está abierto. */
export type ArticuloDialogAgentContext = {
  /** Tallas que muestra el formulario (6 por defecto al crear; las del artículo al editar). */
  getSizes: () => string[]
  getValues: () => { titulo: string; precios: Record<string, string> }
  setValues: (values: Partial<ArticuloFormValues>) => void
}

/** Tool que existe mientras el diálogo de artículo está abierto. */
export function buildArticuloDialogTools(ctx: ArticuloDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: FILL_TOOL,
      description:
        'Llena el titulo y los precios por talla del formulario de articulo abierto. No guarda ni sube imagen: el usuario revisa, elige la imagen si falta y guarda.',
      parameters: VALORES_SCHEMA,
      run: async (args): Promise<ToolResult> => {
        const { values, ignorados, errores } = sanitizeArticuloValues(args, ctx.getSizes())
        if (Object.keys(values).length === 0) {
          return fail(errores.length ? errores.join(' ') : 'No hay ningun campo valido para llenar.')
        }
        ctx.setValues(values)
        return ok({
          aplicado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
          ...(errores.length ? { errores } : {}),
          valores_actuales: ctx.getValues(),
          imagen: IMAGE_NOTICE,
          mensaje: 'Campos llenados. El usuario debe revisar el formulario y presionar el boton para guardar.',
        })
      },
    },
  ]
}

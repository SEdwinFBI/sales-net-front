import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  MAX_READ_ROWS,
  NO_PARAMS,
  fail,
  fold,
  limitRows,
  mergeDateRange,
  ok,
  positiveInt,
} from '@/features/agent/tool-helpers'
import type { Movimiento, MovimientosFilters, Paginacion } from '../types/inventario'

export type OpcionNombre = { id: number; nombre: string }

/** Lo que las pantallas de movimientos (stock y por vendedor) le prestan al agente. */
export type MovimientosAgentContext = {
  getFilters: () => MovimientosFilters
  /** Reemplaza los filtros completos (la pantalla vuelve a la página 1). */
  setFilters: (filters: MovimientosFilters) => void
  /** Quita tipo, sucursal y registró, y vuelve las fechas a hoy (igual que el botón de limpiar). */
  resetFilters: () => void
  getOptions: () => { tipos: { value: string; label: string }[]; sucursales: OpcionNombre[]; usuarios: OpcionNombre[] }
  getMovimientos: () => Movimiento[]
  getPagination: () => Paginacion | undefined
  isLoading: () => boolean
  isDownloading: () => boolean
  /** Descarga el PDF con los filtros actuales; true si salió bien (el error ya lo muestra la pantalla). */
  download: () => Promise<boolean>
  /** Hoy en AAAA-MM-DD: las fechas del filtro nunca quedan vacías. */
  today: () => string
}

const FILTER_KEYS = ['fecha_desde', 'fecha_hasta', 'tipo', 'sucursal_id', 'usuario_id'] as const
const MAX_DETAILS = 5

/** Tools de /inventario/movimientos y /inventario/por-vendedor. */
export function buildMovimientosTools(ctx: MovimientosAgentContext): AgentToolDef[] {
  /** Valida los argumentos de filtrar_movimientos y arma los filtros resultantes. */
  const parse = (args: Record<string, unknown>): { filters: MovimientosFilters } | { error: string } => {
    if (!FILTER_KEYS.some((key) => key in args)) {
      return { error: 'Indica al menos un filtro: fecha_desde, fecha_hasta, tipo, sucursal_id o usuario_id (ver opciones_filtros_movimientos).' }
    }
    const current = ctx.getFilters()
    const next: MovimientosFilters = { ...current, page: 1 }

    if ('fecha_desde' in args || 'fecha_hasta' in args) {
      const merged = mergeDateRange(args, {
        fecha_desde: current.fecha_desde ?? ctx.today(),
        fecha_hasta: current.fecha_hasta ?? ctx.today(),
      })
      if ('error' in merged) return merged
      next.fecha_desde = merged.range.fecha_desde
      next.fecha_hasta = merged.range.fecha_hasta
    }

    const options = ctx.getOptions()
    if ('tipo' in args) {
      const raw = typeof args.tipo === 'string' ? fold(args.tipo) : null
      if (args.tipo === null || raw === '' || raw === 'todos') next.tipo = undefined
      else {
        const tipo = raw === null ? undefined : options.tipos.find((t) => t.value !== '' && (fold(t.value) === raw || fold(t.label) === raw))
        if (!tipo) return { error: `tipo no valido. Opciones: ${options.tipos.filter((t) => t.value).map((t) => t.value).join(', ')} (o 'todos').` }
        next.tipo = tipo.value
      }
    }
    for (const [key, field, list, label] of [
      ['sucursal_id', 'id_sucursal', options.sucursales, 'sucursal'],
      ['usuario_id', 'id_usuario', options.usuarios, 'usuario'],
    ] as const) {
      if (!(key in args)) continue
      const value = args[key]
      if (value === null || value === 0) next[field] = undefined
      else {
        const id = positiveInt(value)
        if (id === null || !list.some((item) => item.id === id)) {
          return { error: `${key} no es ${label === 'sucursal' ? 'una sucursal' : 'un usuario'} de la lista (ver opciones_filtros_movimientos; null = todos).` }
        }
        next[field] = id
      }
    }
    return { filters: next }
  }

  const describeFilters = (filters: MovimientosFilters) => ({
    fecha_desde: filters.fecha_desde ?? ctx.today(),
    fecha_hasta: filters.fecha_hasta ?? ctx.today(),
    tipo: filters.tipo ?? null,
    sucursal_id: filters.id_sucursal ? Number(filters.id_sucursal) : null,
    usuario_id: filters.id_usuario ? Number(filters.id_usuario) : null,
  })

  return [
    {
      name: 'filtrar_movimientos',
      description:
        'Filtra los movimientos de existencias: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), tipo, sucursal_id y usuario_id (quien lo registro). null o "todos" quitan tipo, sucursal o usuario. Usa opciones_filtros_movimientos para los valores validos.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          tipo: { type: ['string', 'null'] },
          sucursal_id: { type: ['integer', 'null'] },
          usuario_id: { type: ['integer', 'null'] },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parse(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters(parsed.filters)
        return ok({
          filtros: describeFilters(parsed.filters),
          mensaje: 'Filtros aplicados. Usa leer_movimientos para ver el resultado (puede tardar un instante en cargar).',
        })
      },
    },
    {
      name: 'limpiar_filtros_movimientos',
      description: 'Quita los filtros de tipo, sucursal y usuario, y vuelve las fechas a hoy (las fechas siempre llevan valor).',
      parameters: NO_PARAMS,
      run: async () => {
        ctx.resetFilters()
        return ok({ mensaje: 'Filtros limpiados; las fechas vuelven a hoy.' })
      },
    },
    {
      name: 'opciones_filtros_movimientos',
      description: 'Devuelve los valores validos de los filtros: tipos de movimiento, sucursales y usuarios (con id y nombre).',
      parameters: NO_PARAMS,
      run: async () => {
        const options = ctx.getOptions()
        return ok({
          tipos: options.tipos.filter((t) => t.value).map((t) => ({ valor: t.value, nombre: t.label })),
          sucursales: options.sucursales,
          usuarios: options.usuarios,
        })
      },
    },
    {
      name: 'leer_movimientos',
      description: `Lista los movimientos de la pagina actual (maximo ${MAX_READ_ROWS}): fecha, tipo, sucursal, quien lo registro, unidades, venta y sus primeros detalles (antes/despues).`,
      parameters: NO_PARAMS,
      run: async () => {
        const movimientos = ctx.getMovimientos()
        const pagination = ctx.getPagination()
        return ok({
          filtros: describeFilters(ctx.getFilters()),
          cargando: ctx.isLoading(),
          ...(pagination ? { pagina: pagination.page, paginas: pagination.total_pages, total: pagination.total } : {}),
          mostrando: Math.min(movimientos.length, MAX_READ_ROWS),
          movimientos: limitRows(movimientos).map((m) => ({
            id: m.id,
            fecha: m.fecha,
            tipo: m.tipo,
            tipo_nombre: m.tipo_display,
            sucursal: m.sucursal_afectada?.nombre ?? null,
            registro: m.usuario_registra ? m.usuario_registra.full_name || m.usuario_registra.username : null,
            total_unidades: m.total_unidades,
            referencia: m.referencia,
            id_venta: m.id_venta,
            ...(m.observacion ? { observacion: m.observacion } : {}),
            detalles: m.detalles.slice(0, MAX_DETAILS).map((d) => ({
              articulo: d.articulo,
              talla: d.talla,
              cantidad: d.cantidad,
              antes: d.cantidad_anterior,
              despues: d.cantidad_resultante,
            })),
            ...(m.detalles.length > MAX_DETAILS ? { detalles_totales: m.detalles.length } : {}),
          })),
        })
      },
    },
    {
      name: 'descargar_pdf_movimientos',
      description: 'Descarga el PDF de movimientos con los filtros actuales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando el PDF.' : ctx.isLoading() ? 'Los movimientos aun estan cargando.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'PDF descargado.' }) : fail('No se pudo descargar el PDF.')),
    },
  ]
}

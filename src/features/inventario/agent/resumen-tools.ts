import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MAX_READ_ROWS, NO_PARAMS, fail, limitRows, mergeDateRange, ok, positiveInt } from '@/features/agent/tool-helpers'
import type { ResumenFilaExistencias, ResumenFilters, ResumenTotales } from '../types/inventario'
import type { OpcionNombre } from './movimientos-tools'

/** Lo que ResumenExistenciasPage le presta al agente. */
export type ResumenAgentContext = {
  getFilters: () => ResumenFilters
  setFilters: (filters: ResumenFilters) => void
  getSucursales: () => OpcionNombre[]
  /** Clientes que lista el selector de la pantalla (solo los primeros 10). */
  getClientes: () => OpcionNombre[]
  getIncluirDetalle: () => boolean
  setIncluirDetalle: (incluir: boolean) => void
  getResumen: () => ResumenFilaExistencias[]
  getTotales: () => ResumenTotales | undefined
  isLoading: () => boolean
  isDownloading: () => boolean
  /** Descarga el PDF; true si salió bien (el error ya lo muestra la pantalla). */
  download: () => Promise<boolean>
  today: () => string
}

const FILTER_KEYS = ['fecha_desde', 'fecha_hasta', 'sucursal_id', 'cliente_id'] as const

/** Tools de /inventario/resumen. */
export function buildResumenTools(ctx: ResumenAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { filters: ResumenFilters; aviso?: string } | { error: string } => {
    if (!FILTER_KEYS.some((key) => key in args)) {
      return { error: 'Indica al menos un filtro: fecha_desde, fecha_hasta, sucursal_id o cliente_id.' }
    }
    const current = ctx.getFilters()
    const next: ResumenFilters = { ...current }
    let aviso: string | undefined

    if ('fecha_desde' in args || 'fecha_hasta' in args) {
      const merged = mergeDateRange(args, {
        fecha_desde: current.fecha_desde ?? ctx.today(),
        fecha_hasta: current.fecha_hasta ?? ctx.today(),
      })
      if ('error' in merged) return merged
      next.fecha_desde = merged.range.fecha_desde
      next.fecha_hasta = merged.range.fecha_hasta
    }

    if ('sucursal_id' in args) {
      if (args.sucursal_id === null || args.sucursal_id === 0) next.id_sucursal = undefined
      else {
        const id = positiveInt(args.sucursal_id)
        if (id === null || !ctx.getSucursales().some((s) => s.id === id)) {
          return { error: 'sucursal_id no es una sucursal de la lista (null = todas).' }
        }
        next.id_sucursal = id
      }
    }

    if ('cliente_id' in args) {
      if (args.cliente_id === null || args.cliente_id === 0) next.id_cliente = undefined
      else {
        const id = positiveInt(args.cliente_id)
        if (id === null) return { error: 'cliente_id debe ser un entero positivo (null = todos); usa buscar_cliente para obtenerlo.' }
        next.id_cliente = id
        if (!ctx.getClientes().some((c) => c.id === id)) {
          // El selector de la pantalla solo lista 10 clientes: el filtro se aplica igual en el servidor.
          aviso = 'Ese cliente no aparece en el selector de la pantalla (solo lista 10 clientes), pero el filtro se aplica igual.'
        }
      }
    }
    return { filters: next, aviso }
  }

  return [
    {
      name: 'filtrar_resumen',
      description:
        'Filtra el resumen de existencias: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), sucursal_id y cliente_id (null = todos). Despues usa leer_resumen.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          sucursal_id: { type: ['integer', 'null'] },
          cliente_id: { type: ['integer', 'null'], description: 'id de buscar_cliente.' },
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
          filtros: {
            fecha_desde: parsed.filters.fecha_desde ?? ctx.today(),
            fecha_hasta: parsed.filters.fecha_hasta ?? ctx.today(),
            sucursal_id: parsed.filters.id_sucursal ? Number(parsed.filters.id_sucursal) : null,
            cliente_id: parsed.filters.id_cliente ? Number(parsed.filters.id_cliente) : null,
          },
          ...(parsed.aviso ? { aviso: parsed.aviso } : {}),
          mensaje: 'Filtros aplicados. Usa leer_resumen para ver el resultado (puede tardar un instante en cargar).',
        })
      },
    },
    {
      name: 'incluir_detalle_pdf',
      description: 'Activa o desactiva incluir el detalle de movimientos en el PDF del resumen.',
      parameters: {
        type: 'object',
        properties: { incluir: { type: 'boolean' } },
        required: ['incluir'],
        additionalProperties: false,
      },
      validar: (args) => (typeof args.incluir === 'boolean' ? null : 'incluir debe ser true o false.'),
      run: async (args) => {
        ctx.setIncluirDetalle(args.incluir as boolean)
        return ok({ incluir_detalle: args.incluir })
      },
    },
    {
      name: 'leer_resumen',
      description: `Lee el resumen de existencias por variante (maximo ${MAX_READ_ROWS} filas): habia, entradas, salidas, vendido y hay, mas los totales.`,
      parameters: NO_PARAMS,
      run: async () => {
        const filas = ctx.getResumen()
        const filters = ctx.getFilters()
        return ok({
          filtros: {
            fecha_desde: filters.fecha_desde ?? ctx.today(),
            fecha_hasta: filters.fecha_hasta ?? ctx.today(),
            sucursal_id: filters.id_sucursal ? Number(filters.id_sucursal) : null,
            cliente_id: filters.id_cliente ? Number(filters.id_cliente) : null,
          },
          incluir_detalle_pdf: ctx.getIncluirDetalle(),
          cargando: ctx.isLoading(),
          total: filas.length,
          mostrando: Math.min(filas.length, MAX_READ_ROWS),
          ...(ctx.getTotales() ? { totales: ctx.getTotales() } : {}),
          filas: limitRows(filas).map((f) => ({
            variante_id: f.id_variante,
            articulo: f.articulo,
            talla: f.talla,
            sucursal: f.sucursal,
            habia: f.habia,
            entradas: f.entradas,
            salidas: f.salidas,
            vendido: f.vendido,
            hay: f.hay,
          })),
        })
      },
    },
    {
      name: 'descargar_pdf_resumen',
      description: 'Descarga el PDF del resumen de existencias con los filtros actuales (y el detalle si esta activado).',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando el PDF.' : ctx.isLoading() ? 'El resumen aun esta cargando.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'PDF descargado.' }) : fail('No se pudo descargar el PDF.')),
    },
  ]
}

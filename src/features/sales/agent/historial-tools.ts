import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  MAX_READ_ROWS,
  NO_PARAMS,
  fail,
  limitRows,
  matchOption,
  mergeDateRange,
  ok,
  positiveInt,
  type DateRange,
} from '@/features/agent/tool-helpers'
import type { AuthUser } from '@/features/core/store/auth-store'
import type { Venta } from '../types/sales'
import { motivoNoAnulableVenta } from '../utils/anulacion-rules'

export type HistorialFilters = DateRange & {
  estado?: string
  forma_pago?: string
  texto: string
}

/** Lo que HistorialVentasPage le presta al agente: sus filtros, sus opciones y su PDF. */
export type HistorialPageAgentContext = {
  getFilters: () => HistorialFilters
  /** Opciones de los selects (salen de las ventas ya cargadas). */
  getOptions: () => { estados: string[]; formasPago: string[] }
  /** `estado` y `forma_pago` en undefined los quitan. Las fechas siempre llevan un valor. */
  setFilters: (filters: Partial<HistorialFilters>) => void
  /** Quita estado, forma de pago y texto; las fechas se conservan (son obligatorias). */
  clearFilters: () => void
  /** Ventas que quedan tras TODOS los filtros (los de la página y los de columna), sin paginar. */
  getFilteredVentas: () => Venta[]
  isLoading: () => boolean
  isExporting: () => boolean
  /** Descarga el PDF; true si salió bien (el error ya lo muestra la página). */
  exportPdf: () => Promise<boolean>
}

const FILTER_KEYS = ['fecha_desde', 'fecha_hasta', 'estado', 'forma_pago', 'texto'] as const
const ALL = ['todos', 'todas', '']

/** Tools de /venta/historial (nivel página: filtros, lectura y PDF). */
export function buildHistorialPageTools(ctx: HistorialPageAgentContext): AgentToolDef[] {
  /** Valida y traduce los argumentos de filtrar_historial a un cambio de filtros. */
  const parse = (args: Record<string, unknown>): { filters: Partial<HistorialFilters> } | { error: string } => {
    if (!FILTER_KEYS.some((key) => key in args)) {
      return { error: 'Indica al menos un filtro: fecha_desde, fecha_hasta, estado, forma_pago o texto.' }
    }
    const filters: Partial<HistorialFilters> = {}

    if ('fecha_desde' in args || 'fecha_hasta' in args) {
      const current = ctx.getFilters()
      const merged = mergeDateRange(args, { fecha_desde: current.fecha_desde, fecha_hasta: current.fecha_hasta })
      if ('error' in merged) return merged
      filters.fecha_desde = merged.range.fecha_desde
      filters.fecha_hasta = merged.range.fecha_hasta
    }

    const { estados, formasPago } = ctx.getOptions()
    if ('estado' in args) {
      if (typeof args.estado === 'string' && ALL.includes(args.estado.trim().toLowerCase())) filters.estado = undefined
      else {
        const estado = matchOption(estados, args.estado)
        if (!estado) return { error: `estado no valido. Opciones: ${estados.join(', ') || 'ninguna (aun no hay ventas)'}.` }
        filters.estado = estado
      }
    }
    if ('forma_pago' in args) {
      if (typeof args.forma_pago === 'string' && ALL.includes(args.forma_pago.trim().toLowerCase())) filters.forma_pago = undefined
      else {
        const forma = matchOption(formasPago, args.forma_pago)
        if (!forma) return { error: `forma_pago no valida. Opciones: ${formasPago.join(', ') || 'ninguna (aun no hay ventas)'}.` }
        filters.forma_pago = forma
      }
    }
    if ('texto' in args) {
      if (typeof args.texto !== 'string') return { error: 'texto debe ser un texto (vacio para quitar el filtro).' }
      filters.texto = args.texto.trim().slice(0, 100)
    }
    return { filters }
  }

  return [
    {
      name: 'filtrar_historial',
      description:
        'Filtra el historial de ventas: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), estado, forma_pago y texto (ID, cliente, sucursal o vendedor). "todos" quita estado o forma de pago.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          estado: { type: 'string', description: "Un estado que exista en la lista, o 'todos'." },
          forma_pago: { type: 'string', description: "Una forma de pago que exista en la lista, o 'todas'." },
          texto: { type: 'string', description: 'Vacio para quitar el filtro de texto.' },
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
          filtros: { ...ctx.getFilters(), ...parsed.filters },
          mensaje: 'Filtros aplicados. Usa leer_historial para ver el resultado (puede tardar un instante en cargar).',
        })
      },
    },
    {
      name: 'limpiar_filtros_historial',
      description: 'Quita los filtros de estado, forma de pago y texto del historial. Las fechas se conservan (son obligatorias).',
      parameters: NO_PARAMS,
      run: async () => {
        ctx.clearFilters()
        return ok({ mensaje: 'Filtros limpiados; las fechas se conservan.' })
      },
    },
    {
      name: 'leer_historial',
      description: `Lista las ventas del historial tras los filtros (maximo ${MAX_READ_ROWS}): id, fecha, cliente, vendedor, sucursal, totales, abonado, saldo, estado, forma de pago y si tiene foto.`,
      parameters: NO_PARAMS,
      run: async () => {
        const ventas = ctx.getFilteredVentas()
        return ok({
          filtros: ctx.getFilters(),
          opciones: ctx.getOptions(),
          cargando: ctx.isLoading(),
          total: ventas.length,
          mostrando: Math.min(ventas.length, MAX_READ_ROWS),
          ventas: limitRows(ventas).map((v) => ({
            id: v.id,
            fecha: v.fecha,
            cliente: v.cliente_info.nombre_completo,
            vendedor: v.vendedor?.full_name ?? null,
            sucursal: v.sucursal.nombre,
            total: Number(v.total),
            total_neto: Number(v.total_neto),
            abonado: Number(v.abonado),
            saldo: Number(v.saldo),
            estado: v.estado,
            forma_pago: v.forma_pago,
            tiene_foto: Boolean(v.foto_url),
          })),
        })
      },
    },
    {
      name: 'descargar_pdf_historial',
      description: 'Descarga el PDF del historial con las ventas que muestran los filtros actuales.',
      parameters: NO_PARAMS,
      validar: () => {
        if (ctx.isExporting()) return 'Ya se esta generando el PDF.'
        if (ctx.getFilteredVentas().length === 0) return 'No hay ventas para exportar con los filtros actuales.'
        return null
      },
      run: async () => {
        const count = ctx.getFilteredVentas().length
        return (await ctx.exportPdf()) ? ok({ mensaje: `PDF descargado con ${count} ventas.` }) : fail('No se pudo descargar el PDF.')
      },
    },
  ]
}

/** Lo que HistorialVentasTable le presta al agente: su fila expandida, su paginación y sus diálogos. */
export type HistorialTableAgentContext = {
  /** Ventas que recibe la tabla (ya filtradas por la página). */
  getVentas: () => Venta[]
  getUser: () => Pick<AuthUser, 'role' | 'puede_anular'> | null
  /** La foto o la anulación están abiertas. */
  isDialogOpen: () => boolean
  /** Expande la fila y mueve la paginación a su página; false si los filtros de columna la ocultan. */
  showDetalle: (ventaId: number) => boolean
  openFoto: (venta: Venta) => void
  openAnular: (venta: Venta) => void
}

const VENTA_ID = {
  type: 'object',
  properties: { venta_id: { type: 'integer', description: 'ID de una venta de leer_historial.' } },
  required: ['venta_id'],
  additionalProperties: false,
} as const

/** Tools de la tabla del historial (existen mientras está montada). */
export function buildHistorialTableTools(ctx: HistorialTableAgentContext): AgentToolDef[] {
  const findVenta = (args: Record<string, unknown>) => {
    const id = positiveInt(args.venta_id)
    return id === null ? undefined : ctx.getVentas().find((v) => v.id === id)
  }
  const NOT_FOUND = 'No encontre esa venta en el historial filtrado (ver leer_historial).'

  return [
    {
      name: 'ver_detalle_venta',
      description: 'Expande el detalle de una venta del historial (articulos y totales) y mueve la tabla a su pagina.',
      parameters: VENTA_ID,
      validar: (args) => (findVenta(args) ? null : NOT_FOUND),
      run: async (args) => {
        const venta = findVenta(args)
        if (!venta) return fail(NOT_FOUND)
        if (!ctx.showDetalle(venta.id)) {
          return fail('Esa venta esta oculta por los filtros de columna de la tabla: quitalos para verla.')
        }
        return ok({ mensaje: `Detalle de la venta #${venta.id} desplegado.` })
      },
    },
    {
      name: 'ver_foto_venta',
      description: 'Abre la foto de entrega de una venta del historial (si tiene).',
      parameters: VENTA_ID,
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const venta = findVenta(args)
        if (!venta) return NOT_FOUND
        return venta.foto_url ? null : 'Esa venta no tiene foto (es anterior a la funcion o ya fue purgada).'
      },
      run: async (args) => {
        const venta = findVenta(args)
        if (!venta) return fail(NOT_FOUND)
        ctx.openFoto(venta)
        return ok({ mensaje: `Foto de la venta #${venta.id} abierta.` })
      },
    },
    {
      name: 'abrir_anular_venta',
      description:
        'Abre la confirmacion existente para anular una venta del historial (si el rol y el estado lo permiten). No anula: el usuario presiona Confirmar anulacion.',
      parameters: VENTA_ID,
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen()) return dialogAlreadyOpenError()
        const venta = findVenta(args)
        if (!venta) return NOT_FOUND
        return motivoNoAnulableVenta(ctx.getUser(), venta)
      },
      run: async (args) => {
        const venta = findVenta(args)
        if (!venta) return fail(NOT_FOUND)
        ctx.openAnular(venta)
        return ok({ mensaje: `Confirmacion para anular la venta #${venta.id} abierta. El usuario debe presionar Confirmar anulacion.` })
      },
    },
  ]
}

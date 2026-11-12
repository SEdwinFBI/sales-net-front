import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  NO_PARAMS,
  fail,
  fold,
  limitRows,
  mergeDateRange,
  ok,
  positiveInt,
  type DateRange,
} from '@/features/agent/tool-helpers'
import type {
  DashboardData,
  ReporteCobrosSucursal,
  ReporteDeudores,
  ReporteResumen,
  ReporteVentaItem,
  ReporteVentaSucursal,
} from '../types/reportes'

const TOP = 10

// -- Dashboard (/reportes/dashboard) ------------------------------------------------------------

export type DashboardFiltersView = DateRange & { sucursal_id?: number; articulo_id?: number; talla_id?: number }

export type DashboardChanges = {
  fecha_desde?: string
  fecha_hasta?: string
  /** null quita el filtro. */
  sucursal?: number | null
  articulo?: number | null
  talla?: number | null
}

/** Lo que DashboardPage le presta al agente. Sus filtros viven en la URL (searchParams). */
export type DashboardAgentContext = {
  getFilters: () => DashboardFiltersView
  /** Escribe los cambios en la URL, igual que los selectores de la pantalla. */
  apply: (changes: DashboardChanges) => void
  /** Limpia todos los filtros (vuelve al rango del mes en curso). */
  clear: () => void
  getOptions: () => {
    sucursales: { id: number; nombre: string }[]
    articulos: { id: number; titulo: string }[]
    /** Tallas con variantes activas de un artículo (las que ofrece el selector). */
    tallasDe: (articuloId: number) => { id: number; nombre: string }[]
  }
  getData: () => DashboardData | undefined
  isLoading: () => boolean
}

const DASH_KEYS = ['fecha_desde', 'fecha_hasta', 'sucursal_id', 'articulo_id', 'talla']

/** Tools de /reportes/dashboard. */
export function buildDashboardTools(ctx: DashboardAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { changes: DashboardChanges } | { error: string } => {
    if (!DASH_KEYS.some((key) => key in args)) {
      return { error: 'Indica al menos un filtro: fecha_desde, fecha_hasta, sucursal_id, articulo_id o talla.' }
    }
    const current = ctx.getFilters()
    const options = ctx.getOptions()
    const changes: DashboardChanges = {}

    if ('fecha_desde' in args || 'fecha_hasta' in args) {
      const merged = mergeDateRange(args, { fecha_desde: current.fecha_desde, fecha_hasta: current.fecha_hasta })
      if ('error' in merged) return merged
      changes.fecha_desde = merged.range.fecha_desde
      changes.fecha_hasta = merged.range.fecha_hasta
    }

    if ('sucursal_id' in args) {
      if (args.sucursal_id === null) changes.sucursal = null
      else {
        const id = positiveInt(args.sucursal_id)
        if (id === null || !options.sucursales.some((s) => s.id === id)) return { error: 'sucursal_id no es una sucursal de la lista (null = todas).' }
        changes.sucursal = id
      }
    }

    // Igual que la pantalla: al cambiar de artículo la talla se borra (depende del artículo).
    let articulo = current.articulo_id
    if ('articulo_id' in args) {
      if (args.articulo_id === null) {
        changes.articulo = null
        articulo = undefined
      } else {
        const id = positiveInt(args.articulo_id)
        if (id === null || !options.articulos.some((a) => a.id === id)) return { error: 'articulo_id no es un articulo de la lista (null = todos).' }
        changes.articulo = id
        articulo = id
      }
      if (articulo !== current.articulo_id) changes.talla = null
    }

    if ('talla' in args) {
      if (args.talla === null) changes.talla = null
      else {
        if (articulo === undefined) return { error: 'La talla depende del articulo: indica primero articulo_id.' }
        const tallas = options.tallasDe(articulo)
        const raw = args.talla
        const talla =
          typeof raw === 'number'
            ? tallas.find((t) => t.id === raw)
            : typeof raw === 'string'
              ? tallas.find((t) => fold(t.nombre) === fold(raw))
              : undefined
        if (!talla) return { error: `talla no valida para ese articulo. Opciones: ${tallas.map((t) => t.nombre).join(', ') || 'ninguna'}.` }
        changes.talla = talla.id
      }
    }
    return { changes }
  }

  return [
    {
      name: 'filtrar_dashboard',
      description:
        'Filtra el dashboard: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), sucursal_id, articulo_id y talla (nombre o id; requiere articulo). null quita un filtro; cambiar de articulo borra la talla.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          sucursal_id: { type: ['integer', 'null'] },
          articulo_id: { type: ['integer', 'null'] },
          talla: { type: ['string', 'integer', 'null'], description: 'Talla del articulo elegido (nombre o id).' },
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
        ctx.apply(parsed.changes)
        return ok({ aplicado: parsed.changes, mensaje: 'Filtros aplicados. Usa leer_dashboard para ver el resultado (puede tardar un instante en cargar).' })
      },
    },
    {
      name: 'limpiar_filtros_dashboard',
      description: 'Quita todos los filtros del dashboard (vuelve al rango del mes en curso).',
      parameters: NO_PARAMS,
      run: async () => {
        ctx.clear()
        return ok({ mensaje: 'Filtros limpiados.' })
      },
    },
    {
      name: 'leer_dashboard',
      description: `Lee el dashboard: KPIs, comparaciones, ventas de hoy, top articulos y sucursales, stock bajo y top deudores (maximo ${TOP} por lista).`,
      parameters: NO_PARAMS,
      run: async () => {
        const data = ctx.getData()
        const filtros = ctx.getFilters()
        if (!data) return fail(ctx.isLoading() ? 'El dashboard aun esta cargando; intenta de nuevo.' : 'No hay datos del dashboard.')
        return ok({
          filtros,
          periodo: data.periodo,
          kpis: data.resumen,
          comparacion: data.comparacion,
          ventas_hoy: data.ventas_hoy,
          top_articulos: limitRows(data.top_articulos ?? [], TOP).map((a) => ({
            articulo_id: a.id_articulo,
            articulo: a.articulo,
            total_neto: a.total_neto,
            unidades: a.unidades,
          })),
          top_sucursales: limitRows(data.top_sucursales ?? [], TOP),
          formas_pago: data.formas_pago,
          stock_bajo: limitRows(data.stock_bajo ?? [], TOP),
          top_deudores: limitRows(data.top_deudores ?? [], TOP).map((d) => ({
            cliente_id: d.id_cliente,
            nombre: d.nombre,
            balance: d.balance,
            ultima_compra: d.ultima_compra,
          })),
        })
      },
    },
  ]
}

// -- Reporte de ventas (/reportes/ventas) -------------------------------------------------------

type Option = { id?: number; label: string }

export type VentasFiltersView = DateRange & { id_sucursal?: number; id_articulo?: number; id_talla?: number }

/** Lo que ReporteVentasPage le presta al agente: fechas en la URL, el resto en estado local. */
export type ReporteVentasAgentContext = {
  getFilters: () => VentasFiltersView
  /** Aplica los filtros completos (como el formulario de filtros de la pantalla). */
  change: (filters: VentasFiltersView) => void
  getOptions: () => { articulos: Option[]; tallas: Option[]; sucursales: Option[] }
  getTab: () => 'variante' | 'sucursal'
  setTab: (tab: 'variante' | 'sucursal') => void
  getResumen: () => ReporteResumen | undefined
  getPorVariante: () => ReporteVentaItem[]
  getPorSucursal: () => ReporteVentaSucursal[]
  isLoading: () => boolean
  isDownloading: () => boolean
  download: () => Promise<boolean>
}

const VENTAS_KEYS = ['fecha_desde', 'fecha_hasta', 'articulo_id', 'talla_id', 'sucursal_id']

/** Tools de /reportes/ventas. */
export function buildReporteVentasTools(ctx: ReporteVentasAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { filters: VentasFiltersView } | { error: string } => {
    if (!VENTAS_KEYS.some((key) => key in args)) {
      return { error: 'Indica al menos un filtro: fecha_desde, fecha_hasta, articulo_id, talla_id o sucursal_id.' }
    }
    const current = ctx.getFilters()
    const options = ctx.getOptions()
    const next: VentasFiltersView = { ...current }

    if ('fecha_desde' in args || 'fecha_hasta' in args) {
      const merged = mergeDateRange(args, { fecha_desde: current.fecha_desde, fecha_hasta: current.fecha_hasta })
      if ('error' in merged) return merged
      next.fecha_desde = merged.range.fecha_desde
      next.fecha_hasta = merged.range.fecha_hasta
    }
    for (const [key, field, list, label] of [
      ['articulo_id', 'id_articulo', options.articulos, 'un articulo'],
      ['talla_id', 'id_talla', options.tallas, 'una talla'],
      ['sucursal_id', 'id_sucursal', options.sucursales, 'una sucursal'],
    ] as const) {
      if (!(key in args)) continue
      if (args[key] === null) next[field] = undefined
      else {
        const id = positiveInt(args[key])
        if (id === null || !list.some((o) => o.id === id)) return { error: `${key} no es ${label} de las opciones del reporte (null = todos).` }
        next[field] = id
      }
    }
    return { filters: next }
  }

  return [
    {
      name: 'filtrar_reporte_ventas',
      description:
        'Filtra el reporte de ventas: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), articulo_id, talla_id y sucursal_id (null = todos). Los ids salen de las opciones del reporte.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          articulo_id: { type: ['integer', 'null'] },
          talla_id: { type: ['integer', 'null'] },
          sucursal_id: { type: ['integer', 'null'] },
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
        ctx.change(parsed.filters)
        return ok({ filtros: parsed.filters, mensaje: 'Filtros aplicados. Usa leer_reporte_ventas para ver el resultado (puede tardar un instante en cargar).' })
      },
    },
    {
      name: 'cambiar_pestana_reporte_ventas',
      description: "Cambia la pestana del reporte de ventas: 'variante' (por variante) o 'sucursales'.",
      parameters: {
        type: 'object',
        properties: { pestana: { type: 'string', enum: ['variante', 'sucursales'] } },
        required: ['pestana'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => (args.pestana === 'variante' || args.pestana === 'sucursales' ? null : "pestana debe ser 'variante' o 'sucursales'."),
      run: async (args) => {
        ctx.setTab(args.pestana === 'sucursales' ? 'sucursal' : 'variante')
        return ok({ pestana: args.pestana })
      },
    },
    {
      name: 'leer_reporte_ventas',
      description: 'Lee el reporte de ventas: resumen (totales) y la lista de la pestana activa (por variante o por sucursal, maximo 30 filas).',
      parameters: NO_PARAMS,
      run: async () => {
        const tab = ctx.getTab()
        const resumen = ctx.getResumen()
        return ok({
          filtros: ctx.getFilters(),
          cargando: ctx.isLoading(),
          pestana: tab === 'sucursal' ? 'sucursales' : 'variante',
          ...(resumen ? { resumen } : {}),
          ...(tab === 'variante'
            ? {
                total: ctx.getPorVariante().length,
                variantes: limitRows(ctx.getPorVariante()).map((v) => ({
                  articulo: v.articulo,
                  talla: v.talla,
                  unidades: v.unidades,
                  total_bruto: v.total_bruto,
                  descuento_total: v.descuento_total,
                  total_neto: v.total_neto,
                })),
              }
            : {
                total: ctx.getPorSucursal().length,
                sucursales: limitRows(ctx.getPorSucursal()).map((s) => ({
                  sucursal_id: s.id_sucursal,
                  nombre: s.nombre,
                  ventas: s.cantidad_ventas,
                  unidades: s.unidades,
                  total_neto: s.total_neto,
                })),
              }),
        })
      },
    },
    {
      name: 'descargar_pdf_reporte_ventas',
      description: 'Descarga el PDF del reporte de ventas con los filtros actuales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando el PDF.' : ctx.isLoading() ? 'El reporte aun esta cargando.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'PDF descargado.' }) : fail('No se pudo descargar el PDF.')),
    },
  ]
}

// -- Deudores (/reportes/deudores) --------------------------------------------------------------

/** Lo que ReporteDeudoresPage le presta al agente (filtros en estado local). */
export type DeudoresAgentContext = {
  getFilters: () => { nombre?: string; lugar?: string }
  setFilters: (filters: { nombre?: string; lugar?: string }) => void
  getClientes: () => ReporteDeudores['data']['clientes']
  getResumen: () => ReporteDeudores['data']['resumen'] | undefined
  isLoading: () => boolean
  isDownloading: () => boolean
  download: () => Promise<boolean>
}

/** Tools de /reportes/deudores. */
export function buildDeudoresTools(ctx: DeudoresAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { changes: { nombre?: string; lugar?: string } } | { error: string } => {
    if (!('nombre' in args) && !('lugar' in args)) return { error: 'Indica al menos un filtro: nombre o lugar (vacio para quitarlo).' }
    const changes: { nombre?: string; lugar?: string } = {}
    for (const key of ['nombre', 'lugar'] as const) {
      if (!(key in args)) continue
      if (typeof args[key] !== 'string') return { error: `${key} debe ser un texto (vacio para quitar el filtro).` }
      changes[key] = args[key].trim().slice(0, 100)
    }
    return { changes }
  }

  return [
    {
      name: 'filtrar_deudores',
      description: 'Filtra el reporte de deudores por nombre del cliente y/o lugar (direccion). Texto vacio quita el filtro. Despues usa leer_deudores.',
      parameters: {
        type: 'object',
        properties: { nombre: { type: 'string' }, lugar: { type: 'string' } },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parse(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters({ ...ctx.getFilters(), ...parsed.changes })
        return ok({ filtros: { ...ctx.getFilters(), ...parsed.changes }, mensaje: 'Filtros aplicados. Usa leer_deudores para ver el resultado.' })
      },
    },
    {
      name: 'leer_deudores',
      description: 'Lee los clientes con saldo pendiente (maximo 30): nombre, telefono, direccion, balance, ultima compra y ventas pendientes, mas el resumen.',
      parameters: NO_PARAMS,
      run: async () => {
        const clientes = ctx.getClientes()
        const resumen = ctx.getResumen()
        return ok({
          filtros: ctx.getFilters(),
          cargando: ctx.isLoading(),
          ...(resumen ? { resumen } : {}),
          total: clientes.length,
          clientes: limitRows(clientes).map((c) => ({
            cliente_id: c.id,
            nombre: c.nombre_completo,
            telefono: c.telefono,
            direccion: c.direccion ?? null,
            balance: c.balance,
            ultima_compra: c.ultima_compra,
            ventas_pendientes: c.total_ventas_pendientes,
            total_abonado: c.total_abonado,
          })),
        })
      },
    },
    {
      name: 'descargar_pdf_deudores',
      description: 'Descarga el PDF del reporte de deudores con los filtros actuales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando el PDF.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'PDF descargado.' }) : fail('No se pudo descargar el PDF.')),
    },
  ]
}

// -- Cobros (/reportes/cobros) ------------------------------------------------------------------

/** Lo que ReporteCobrosPage le presta al agente (filtros en estado local). */
export type CobrosAgentContext = {
  getFilters: () => { nombre?: string; fecha?: string }
  setFilters: (filters: { nombre?: string; fecha?: string }) => void
  getPorSucursal: () => ReporteCobrosSucursal[]
  isLoading: () => boolean
  isDownloading: () => boolean
  download: () => Promise<boolean>
  /** PDF de un usuario (sucursal null = cobros sin sucursal), con la fecha filtrada. */
  downloadUser: (usuarioId: number, sucursalId: number | null) => Promise<boolean>
}

/** Tools de /reportes/cobros. */
export function buildCobrosTools(ctx: CobrosAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { changes: { nombre?: string; fecha?: string } } | { error: string } => {
    if (!('nombre' in args) && !('fecha' in args)) return { error: 'Indica al menos un filtro: nombre o fecha.' }
    const changes: { nombre?: string; fecha?: string } = {}
    if ('nombre' in args) {
      if (typeof args.nombre !== 'string') return { error: 'nombre debe ser un texto (vacio para quitar el filtro).' }
      changes.nombre = args.nombre.trim().slice(0, 100)
    }
    if ('fecha' in args) {
      // Igual que la pantalla, esta fecha puntual es opcional: null o vacio la quita.
      if (args.fecha === null || args.fecha === '') changes.fecha = ''
      else if (typeof args.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.fecha) && !Number.isNaN(Date.parse(args.fecha))) {
        const [y, m, d] = args.fecha.split('-').map(Number)
        const date = new Date(Date.UTC(y, m - 1, d))
        if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return { error: 'fecha debe ser una fecha real AAAA-MM-DD (null la quita).' }
        changes.fecha = args.fecha
      } else return { error: 'fecha debe ser una fecha real AAAA-MM-DD (null la quita).' }
    }
    return { changes }
  }

  type Found = { error: string } | { usuarioId: number; sucursalId: number | null; nombre: string }
  const findUser = (args: Record<string, unknown>): Found => {
    const usuarioId = positiveInt(args.usuario_id)
    if (usuarioId === null) return { error: 'usuario_id debe ser un entero positivo (ver leer_cobros).' }
    const sucursalId = args.sucursal_id === null ? null : positiveInt(args.sucursal_id)
    if (args.sucursal_id !== null && sucursalId === null) return { error: 'sucursal_id debe ser un entero positivo, o null para los cobros sin sucursal.' }
    const sucursal = ctx.getPorSucursal().find((s) => s.id_sucursal === sucursalId)
    const usuario = sucursal?.por_usuario.find((u) => u.id_usuario === usuarioId)
    if (!sucursal || !usuario) return { error: 'No encontre ese usuario en esa sucursal del reporte (ver leer_cobros).' }
    return { usuarioId, sucursalId, nombre: usuario.nombre }
  }

  return [
    {
      name: 'filtrar_cobros',
      description: 'Filtra el reporte de cobros por nombre del usuario y/o fecha puntual (AAAA-MM-DD). Nombre vacio o fecha null quitan el filtro. Despues usa leer_cobros.',
      parameters: {
        type: 'object',
        properties: { nombre: { type: 'string' }, fecha: { type: ['string', 'null'], description: 'AAAA-MM-DD' } },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parse(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parse(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters({ ...ctx.getFilters(), ...parsed.changes })
        return ok({ filtros: { ...ctx.getFilters(), ...parsed.changes }, mensaje: 'Filtros aplicados. Usa leer_cobros para ver el resultado.' })
      },
    },
    {
      name: 'leer_cobros',
      description: 'Lee los cobros por sucursal y usuario (maximo 30 usuarios): sucursal_id, usuario_id, cantidad de cobros, total abonado y restante.',
      parameters: NO_PARAMS,
      run: async () => {
        const sucursales = ctx.getPorSucursal()
        let restantes = 30
        const lista = sucursales.map((s) => {
          const usuarios = s.por_usuario.slice(0, Math.max(restantes, 0))
          restantes -= usuarios.length
          return {
            sucursal_id: s.id_sucursal,
            nombre: s.nombre,
            total_abonado: s.total_abonado,
            usuarios: usuarios.map((u) => ({
              usuario_id: u.id_usuario,
              nombre: u.nombre,
              cobros: u.cantidad_cobros,
              total_abonado: u.total_abonado,
              total_restante: u.total_restante,
            })),
          }
        })
        return ok({ filtros: ctx.getFilters(), cargando: ctx.isLoading(), total_sucursales: sucursales.length, sucursales: lista })
      },
    },
    {
      name: 'descargar_pdf_cobros',
      description: 'Descarga el PDF del reporte de cobros con los filtros actuales.',
      parameters: NO_PARAMS,
      validar: () => (ctx.isDownloading() ? 'Ya se esta generando un PDF.' : null),
      run: async () => ((await ctx.download()) ? ok({ mensaje: 'PDF descargado.' }) : fail('No se pudo descargar el PDF.')),
    },
    {
      name: 'descargar_pdf_cobros_usuario',
      description: 'Descarga el PDF de cobros de un usuario de una sucursal (ids de leer_cobros; sucursal_id null = sin sucursal), con la fecha filtrada.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer' }, sucursal_id: { type: ['integer', 'null'] } },
        required: ['usuario_id', 'sucursal_id'],
        additionalProperties: false,
      },
      validar: (args) => {
        if (ctx.isDownloading()) return 'Ya se esta generando un PDF.'
        const found = findUser(args)
        return 'error' in found ? found.error : null
      },
      run: async (args) => {
        const found = findUser(args)
        if ('error' in found) return fail(found.error)
        return (await ctx.downloadUser(found.usuarioId, found.sucursalId))
          ? ok({ mensaje: `PDF de ${found.nombre} descargado.` })
          : fail('No se pudo descargar el PDF.')
      },
    },
  ]
}

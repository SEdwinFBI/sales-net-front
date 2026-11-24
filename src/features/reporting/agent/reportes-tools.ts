import { type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { MIN_SIMILARITY, similarity } from '@/features/agent/fuzzy-search'
import {
  NO_PARAMS,
  cleanText,
  fail,
  fold,
  limitRows,
  mergeDateRange,
  ok,
  positiveInt,
  type DateRange,
  filtersAppliedMessage,
  loadingNotice,
  waitForLoad,
} from '@/features/agent/tool-helpers'
import { getClienteRows } from '../utils/cobros-clientes'
import type {
  DashboardData,
  ReporteCobroItem,
  ReporteCobrosSucursal,
  ReporteDeudores,
  ReporteResumen,
  ReporteVentaItem,
  ReporteVentaSucursal,
} from '../types/reportes'

const TOP = 10

/** Opciones de un selector, acotadas por texto: el catálogo de artículos puede ser largo. */
function pickOptions<T>(options: readonly T[], label: (option: T) => string, texto: unknown) {
  const needle = typeof texto === 'string' ? fold(texto.trim()) : ''
  const matching = needle ? options.filter((option) => fold(label(option)).includes(needle)) : options
  return { total: matching.length, lista: limitRows(matching) }
}

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
          sucursal_id: { type: ['integer', 'null'], description: 'id de opciones_filtros_dashboard; null = todas.' },
          articulo_id: { type: ['integer', 'null'], description: 'id de opciones_filtros_dashboard; null = todos.' },
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
        const cargado = await waitForLoad(ctx.isLoading)
        return ok({ aplicado: parsed.changes, cargando: !cargado, mensaje: filtersAppliedMessage('leer_dashboard', cargado) })
      },
    },
    {
      name: 'opciones_filtros_dashboard',
      description:
        'Devuelve los valores validos de los filtros del dashboard: sucursales y articulos (con id; texto acota los articulos) y las tallas del articulo filtrado.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Parte del nombre del articulo, para acotar la lista.' } },
        additionalProperties: false,
      },
      run: async (args) => {
        const options = ctx.getOptions()
        const articulos = pickOptions(options.articulos, (a) => a.titulo, args.texto)
        const articuloId = ctx.getFilters().articulo_id
        return ok({
          sucursales: limitRows(options.sucursales),
          total_articulos: articulos.total,
          articulos: articulos.lista,
          ...(articuloId ? { tallas_del_articulo_filtrado: options.tallasDe(articuloId) } : {}),
        })
      },
    },
    {
      name: 'limpiar_filtros_dashboard',
      description: 'Quita todos los filtros del dashboard (vuelve al rango del mes en curso).',
      parameters: NO_PARAMS,
      run: async () => {
        ctx.clear()
        const cargado = await waitForLoad(ctx.isLoading)
        return ok({ cargando: !cargado, mensaje: 'Filtros limpiados.' + (cargado ? '' : ' Los datos aun cargan: espera y llama leer_dashboard.') })
      },
    },
    {
      name: 'leer_dashboard',
      description: 'Lee el dashboard: KPIs, comparaciones, hoy, top articulos y sucursales, stock bajo y deudores. Totales en por_origen {global,pos,cliente}: usa global (tambien por sucursal o cliente) salvo que el usuario pida explicitamente POS o registradas en cliente; por articulo o talla solo hay POS.',
      parameters: NO_PARAMS,
      run: async () => {
        const data = ctx.getData()
        const filtros = ctx.getFilters()
        if (!data) return fail(ctx.isLoading() ? 'El dashboard aun esta cargando; intenta de nuevo.' : 'No hay datos del dashboard.')
        return ok({
          filtros,
          periodo: data.periodo,
          ...(data.resumen?.por_origen?.nota ? { nota: data.resumen.por_origen.nota } : {}),
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
          formas_pago: data.formas_pago_global ?? data.formas_pago,
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
        'Filtra el reporte de ventas: fecha_desde y fecha_hasta (AAAA-MM-DD, siempre con valor), articulo_id, talla_id y sucursal_id (null = todos). Los ids salen de opciones_filtros_reporte_ventas.',
      parameters: {
        type: 'object',
        properties: {
          fecha_desde: { type: 'string', description: 'AAAA-MM-DD' },
          fecha_hasta: { type: 'string', description: 'AAAA-MM-DD' },
          articulo_id: { type: ['integer', 'null'], description: 'id de opciones_filtros_reporte_ventas; null = todos.' },
          talla_id: { type: ['integer', 'null'], description: 'id de opciones_filtros_reporte_ventas; null = todas.' },
          sucursal_id: { type: ['integer', 'null'], description: 'id de opciones_filtros_reporte_ventas; null = todas.' },
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
        const cargado = await waitForLoad(ctx.isLoading)
        return ok({ filtros: parsed.filters, cargando: !cargado, mensaje: filtersAppliedMessage('leer_reporte_ventas', cargado) })
      },
    },
    {
      name: 'opciones_filtros_reporte_ventas',
      description:
        'Devuelve los valores validos de los filtros del reporte de ventas: articulos, tallas y sucursales con su id (texto acota los articulos).',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Parte del nombre del articulo, para acotar la lista.' } },
        additionalProperties: false,
      },
      run: async (args) => {
        const options = ctx.getOptions()
        const withId = (list: Option[]) => list.filter((o) => o.id !== undefined).map((o) => ({ id: o.id, nombre: o.label }))
        const articulos = pickOptions(withId(options.articulos), (a) => a.nombre, args.texto)
        return ok({
          total_articulos: articulos.total,
          articulos: articulos.lista,
          tallas: limitRows(withId(options.tallas)),
          sucursales: limitRows(withId(options.sucursales)),
        })
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
      description: 'Lee el reporte de ventas: resumen con por_origen {global,pos,cliente} y la pestana activa (variante o sucursal, max 30). Usa global (tambien por sucursal o cliente) salvo que el usuario pida explicitamente POS o registradas en cliente; por articulo o talla solo hay POS.',
      parameters: NO_PARAMS,
      run: async () => {
        const tab = ctx.getTab()
        const resumen = ctx.getResumen()
        return ok({
          filtros: ctx.getFilters(),
          cargando: ctx.isLoading(),
          ...(ctx.isLoading() ? { aviso: loadingNotice('leer_reporte_ventas') } : {}),
          pestana: tab === 'sucursal' ? 'sucursales' : 'variante',
          ...(resumen ? { resumen } : {}),
          ...(resumen?.por_origen?.nota ? { nota: resumen.por_origen.nota } : {}),
          ...((tab === 'sucursal' ? ctx.getPorSucursal() : ctx.getPorVariante()).length === 0 && !ctx.isLoading()
            ? { sugerencia: 'Sin ventas con estos filtros. Amplia las fechas o quita articulo, talla y sucursal con filtrar_reporte_ventas.' }
            : {}),
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
                  total_pos: s.total_neto,
                  total_cliente: s.total_cliente ?? null,
                  ventas_cliente: s.cantidad_ventas_cliente ?? null,
                  total_global: s.total_global ?? s.total_neto,
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
        properties: {
          nombre: { type: 'string', description: 'Nombre del CLIENTE deudor (no del vendedor).' },
          lugar: { type: 'string', description: 'Direccion o lugar del cliente.' },
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
        ctx.setFilters({ ...ctx.getFilters(), ...parsed.changes })
        const cargado = await waitForLoad(ctx.isLoading)
        return ok({ filtros: { ...ctx.getFilters(), ...parsed.changes }, cargando: !cargado, mensaje: filtersAppliedMessage('leer_deudores', cargado) })
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
          ...(ctx.isLoading() ? { aviso: loadingNotice('leer_deudores') } : {}),
          ...(resumen ? { resumen } : {}),
          total: clientes.length,
          ...(clientes.length === 0 && !ctx.isLoading()
            ? { sugerencia: 'Ningun deudor con estos filtros. Quita el filtro con filtrar_deudores({nombre:"",lugar:""}); si el cliente no aparece, no debe nada o usa buscar_cliente y su ficha.' }
            : {}),
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

/** Clientes que el resumen de `leer_cobros` muestra en total y por vendedor (cuidan el límite de lo que se manda al modelo). */
const MAX_CLIENTES_RESUMEN = 25
const CLIENTES_POR_USUARIO = 3
const MAX_COBROS_DETALLE = 10

type FiltrosCobrosVista = { vendedor: string; fecha: string }

const resumenCliente = (c: ReturnType<typeof getClienteRows>[number]) => ({
  cliente_id: c.id_cliente,
  nombre: c.nombre_completo.slice(0, 40),
  total_cobrado: Number(c.total_cobrado),
  cantidad_cobros: c.cantidad_cobros ?? null,
  saldo_restante: c.saldo_restante ?? c.balance ?? null,
})

/** Pista para el modelo cuando el reporte no trae nada con los filtros actuales. */
function sinCobros(filtros: FiltrosCobrosVista): string {
  if (filtros.vendedor) {
    return `Sin cobros del vendedor '${filtros.vendedor}'. Si '${filtros.vendedor}' es un cliente, quita el filtro con filtrar_cobros({vendedor:''}) y usa leer_cobros({cliente:'${filtros.vendedor}'}), o buscar_cliente y su ficha.`
  }
  return filtros.fecha ? `Nadie cobro el ${filtros.fecha}. Quita o cambia la fecha con filtrar_cobros({fecha:null}).` : 'El reporte no trae cobros.'
}

/** Cuánto abonó un cliente, sumando lo que cobró cada vendedor (agrupado en el front con los datos ya cargados). */
function leerPorCliente(sucursales: ReporteCobrosSucursal[], texto: string, filtros: FiltrosCobrosVista, cargando: boolean) {
  const needle = fold(texto)
  const coincide = (nombre: string) => fold(nombre).includes(needle) || similarity(texto, nombre) >= MIN_SIMILARITY
  type Cobro = { abono_id: number; fecha: string; monto: number; venta_id: number }
  const porCliente = new Map<
    number,
    {
      cliente_id: number
      nombre: string
      total_cobrado: number
      cantidad_cobros: number
      cobrado_por: { vendedor: string; usuario_id: number | null; sucursal: string; total_cobrado: number; cantidad_cobros: number | null; saldo_restante: number | null }[]
      cobros: Cobro[]
    }
  >()
  let clientesConCobros = 0

  for (const s of sucursales) {
    for (const u of s.por_usuario) {
      const items: ReporteCobroItem[] = u.cobros ?? []
      for (const c of getClienteRows(u)) {
        clientesConCobros++
        if (!coincide(c.nombre_completo)) continue
        const total = Number(c.total_cobrado)
        const propios = items.filter((item) => item.cliente.id === c.id_cliente)
        const acc = porCliente.get(c.id_cliente) ?? { cliente_id: c.id_cliente, nombre: c.nombre_completo, total_cobrado: 0, cantidad_cobros: 0, cobrado_por: [], cobros: [] }
        acc.total_cobrado += total
        acc.cantidad_cobros += c.cantidad_cobros ?? propios.length
        acc.cobrado_por.push({
          vendedor: u.nombre,
          usuario_id: u.id_usuario,
          sucursal: s.nombre,
          total_cobrado: total,
          cantidad_cobros: c.cantidad_cobros ?? null,
          saldo_restante: c.saldo_restante ?? c.balance ?? null,
        })
        acc.cobros.push(...propios.map((item) => ({ abono_id: item.id_abono, fecha: item.fecha_abono, monto: Number(item.monto), venta_id: item.id_venta })))
        porCliente.set(c.id_cliente, acc)
      }
    }
  }

  const clientes = [...porCliente.values()].sort((a, b) => b.total_cobrado - a.total_cobrado)
  const mostrados = limitRows(clientes, 10).map((c) => ({ ...c, nombre: c.nombre.slice(0, 40), cobros: c.cobros.slice(0, MAX_COBROS_DETALLE) }))
  let sugerencia: string | undefined
  if (cargando) sugerencia = 'El reporte aun esta cargando: vuelve a llamar leer_cobros con cliente.'
  else if (clientes.length === 0) {
    const vendedor = filtros.vendedor ? ` Hay un filtro de vendedor ('${filtros.vendedor}'): solo cuenta lo que cobro ese vendedor; quitalo con filtrar_cobros({vendedor:''}).` : ''
    const fecha = filtros.fecha ? ` El reporte esta filtrado al ${filtros.fecha}: si no aparece, ese cliente no abono ese dia.` : ''
    sugerencia =
      clientesConCobros === 0
        ? `El reporte no trae cobros con estos filtros.${vendedor}${fecha}`
        : `Ningun cliente parecido a '${texto}' entre los ${clientesConCobros} con cobros.${vendedor}${fecha} Para su historial completo usa buscar_cliente y la ficha (leer_abonos_cliente con fecha_desde y fecha_hasta).`
  }
  return {
    cliente_buscado: texto,
    total_cobrado: clientes.reduce((sum, c) => sum + c.total_cobrado, 0),
    total_clientes_encontrados: clientes.length,
    clientes: mostrados,
    ...(sugerencia ? { sugerencia } : {}),
  }
}

/** Tools de /reportes/cobros. */
export function buildCobrosTools(ctx: CobrosAgentContext): AgentToolDef[] {
  const parse = (args: Record<string, unknown>): { changes: { nombre?: string; fecha?: string } } | { error: string } => {
    if (!('vendedor' in args) && !('fecha' in args)) return { error: 'Indica al menos un filtro: vendedor (quien recibio el abono) o fecha.' }
    const changes: { nombre?: string; fecha?: string } = {}
    if ('vendedor' in args) {
      if (typeof args.vendedor !== 'string') return { error: 'vendedor debe ser un texto con el nombre del vendedor que cobro (vacio para quitar el filtro). Para un cliente usa leer_cobros con cliente.' }
      // El API llama `nombre` a este filtro: busca por el usuario que recibio el abono.
      changes.nombre = args.vendedor.trim().slice(0, 100)
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

  const filtrosVista = (f: { nombre?: string; fecha?: string }): FiltrosCobrosVista => ({ vendedor: f.nombre ?? '', fecha: f.fecha ?? '' })

  return [
    {
      name: 'filtrar_cobros',
      description:
        'Filtra el reporte de cobros por VENDEDOR que recibio el abono (NO filtra por cliente: para un cliente usa leer_cobros con cliente) y/o fecha puntual AAAA-MM-DD. vendedor vacio o fecha null quitan el filtro. Despues usa leer_cobros.',
      parameters: {
        type: 'object',
        properties: {
          vendedor: { type: 'string', description: 'Nombre o usuario del vendedor que cobro; nunca el nombre de un cliente.' },
          fecha: { type: ['string', 'null'], description: 'AAAA-MM-DD' },
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
        ctx.setFilters({ ...ctx.getFilters(), ...parsed.changes })
        const cargado = await waitForLoad(ctx.isLoading)
        return ok({
          filtros: filtrosVista({ ...ctx.getFilters(), ...parsed.changes }),
          cargando: !cargado,
          mensaje: filtersAppliedMessage('leer_cobros', cargado, ' El vendedor es quien recibio el abono, no el cliente (para un cliente: leer_cobros con cliente).'),
        })
      },
    },
    {
      name: 'leer_cobros',
      description:
        'Lee los cobros (abonos recibidos) por sucursal y VENDEDOR que cobro, con total y top clientes. Con cliente="X" da cuanto abono ese cliente (total, cantidad, quien cobro) segun los filtros. Maximo 30 vendedores.',
      parameters: {
        type: 'object',
        properties: { cliente: { type: 'string', description: 'Nombre (o parte) del CLIENTE que abono. Omitir = resumen por vendedor.' } },
        additionalProperties: false,
      },
      run: async (args) => {
        const sucursales = ctx.getPorSucursal()
        const filtros = filtrosVista(ctx.getFilters())
        const cargando = ctx.isLoading()
        if ('cliente' in args) {
          const texto = cleanText(args.cliente, 100)
          if (!texto) return fail('cliente debe ser el nombre (o parte) del cliente; omitelo para ver el resumen por vendedor.')
          return ok({ filtros, cargando, ...leerPorCliente(sucursales, texto, filtros, cargando) })
        }

        const totales = {
          total_abonado: sucursales.reduce((sum, s) => sum + Number(s.total_abonado ?? 0), 0),
          total_cobros: sucursales.reduce((sum, s) => sum + s.por_usuario.reduce((n, u) => n + Number(u.cantidad_cobros ?? 0), 0), 0),
        }
        let restantes = 30
        let clientesRestantes = MAX_CLIENTES_RESUMEN
        const lista = sucursales.map((s) => {
          const usuarios = s.por_usuario.slice(0, Math.max(restantes, 0))
          restantes -= usuarios.length
          return {
            sucursal_id: s.id_sucursal,
            nombre: s.nombre,
            total_abonado: s.total_abonado,
            usuarios: usuarios.map((u) => {
              const clientes = [...getClienteRows(u)].sort((a, b) => Number(b.total_cobrado) - Number(a.total_cobrado))
              const top = clientes.slice(0, Math.max(Math.min(CLIENTES_POR_USUARIO, clientesRestantes), 0))
              clientesRestantes -= top.length
              return {
                usuario_id: u.id_usuario,
                nombre: u.nombre,
                cobros: u.cantidad_cobros,
                total_abonado: u.total_abonado,
                total_restante: u.total_restante,
                top_clientes: top.map(resumenCliente),
                clientes_omitidos: clientes.length - top.length,
              }
            }),
          }
        })
        const hayUsuarios = sucursales.some((s) => s.por_usuario.length > 0)
        const sugerencia = cargando
          ? 'El reporte aun esta cargando: vuelve a llamar leer_cobros.'
          : hayUsuarios
            ? 'Los clientes mostrados son solo los de mayor monto. Para uno concreto usa leer_cobros con cliente.'
            : sinCobros(filtros)
        return ok({ filtros, cargando, ...totales, total_sucursales: sucursales.length, sucursales: lista, sugerencia })
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
        properties: {
          usuario_id: { type: 'integer', description: 'usuario_id de leer_cobros.' },
          sucursal_id: { type: ['integer', 'null'], description: 'sucursal_id de leer_cobros; null = sin sucursal.' },
        },
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

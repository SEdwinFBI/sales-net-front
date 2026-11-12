import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  buildCobrosTools,
  buildDashboardTools,
  buildDeudoresTools,
  buildReporteVentasTools,
  type CobrosAgentContext,
  type DashboardAgentContext,
  type DashboardChanges,
  type DeudoresAgentContext,
  type ReporteVentasAgentContext,
  type VentasFiltersView,
} from './reportes-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
/** Igual que `execute` del registro: validar primero y solo entonces correr. */
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}
const errorOf = (result: Awaited<ReturnType<typeof ejecutar>>) => ('error' in result ? result.error : '')

// -- Dashboard ---------------------------------------------------------------------------------

function dashboardContext(over: Partial<DashboardAgentContext> = {}) {
  const apply = vi.fn<(changes: DashboardChanges) => void>()
  const ctx: DashboardAgentContext = {
    getFilters: () => ({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14', articulo_id: 5, talla_id: 9 }),
    apply,
    clear: vi.fn(),
    getOptions: () => ({
      sucursales: [{ id: 1, nombre: 'Centro' }],
      articulos: [
        { id: 5, titulo: 'Camisa' },
        { id: 6, titulo: 'Pantalon' },
      ],
      tallasDe: (articuloId) =>
        articuloId === 6
          ? [{ id: 20, nombre: '32' }]
          : [
              { id: 9, nombre: 'M' },
              { id: 10, nombre: 'L' },
            ],
    }),
    getData: () => undefined,
    isLoading: () => false,
    ...over,
  }
  return { ctx, apply }
}

describe('filtrar_dashboard', () => {
  it('aplica rango y sucursal como cambios para los searchParams', async () => {
    const { ctx, apply } = dashboardContext()
    const result = await ejecutar(tool(buildDashboardTools(ctx), 'filtrar_dashboard'), {
      fecha_desde: '2026-09-01',
      sucursal_id: 1,
    })
    expect(result.ok).toBe(true)
    expect(apply).toHaveBeenCalledWith({ fecha_desde: '2026-09-01', fecha_hasta: '2026-10-14', sucursal: 1 })
  })

  it('al cambiar de artículo borra la talla, igual que el selector de la pantalla', async () => {
    const { ctx, apply } = dashboardContext()
    await ejecutar(tool(buildDashboardTools(ctx), 'filtrar_dashboard'), { articulo_id: 6 })
    expect(apply).toHaveBeenCalledWith({ articulo: 6, talla: null })
  })

  it('con el mismo artículo conserva la talla', async () => {
    const { ctx, apply } = dashboardContext()
    await ejecutar(tool(buildDashboardTools(ctx), 'filtrar_dashboard'), { articulo_id: 5 })
    expect(apply).toHaveBeenCalledWith({ articulo: 5 })
  })

  it('acepta la talla por nombre solo si es del artículo elegido', async () => {
    const { ctx, apply } = dashboardContext()
    const def = tool(buildDashboardTools(ctx), 'filtrar_dashboard')
    expect((await ejecutar(def, { talla: 'l' })).ok).toBe(true)
    expect(apply).toHaveBeenLastCalledWith({ talla: 10 })
    expect(errorOf(await ejecutar(def, { articulo_id: 6, talla: 'M' }))).toMatch(/talla no valida/)
  })

  it('exige articulo para la talla y rechaza fechas vacías o inventadas', async () => {
    const { ctx } = dashboardContext({ getFilters: () => ({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14' }) })
    const def = tool(buildDashboardTools(ctx), 'filtrar_dashboard')
    expect(errorOf(await ejecutar(def, { talla: 'M' }))).toMatch(/articulo/)
    expect((await ejecutar(def, { fecha_desde: '' })).ok).toBe(false)
    expect((await ejecutar(def, { fecha_hasta: '2026-02-31' })).ok).toBe(false)
    expect((await ejecutar(def, { fecha_desde: '2026-11-01' })).ok).toBe(false)
    expect((await ejecutar(def, {})).ok).toBe(false)
  })

  it('rechaza sucursales o artículos que no están en las opciones', async () => {
    const { ctx, apply } = dashboardContext()
    const def = tool(buildDashboardTools(ctx), 'filtrar_dashboard')
    expect((await ejecutar(def, { sucursal_id: 99 })).ok).toBe(false)
    expect((await ejecutar(def, { articulo_id: 99 })).ok).toBe(false)
    expect(apply).not.toHaveBeenCalled()
  })

  it('leer_dashboard acota las listas a 10 y falla mientras carga', async () => {
    const top_articulos = Array.from({ length: 25 }, (_, i) => ({ id_articulo: i, articulo: `A${i}`, total_neto: 1, unidades: 1 }))
    const loading = dashboardContext({ isLoading: () => true })
    expect((await tool(buildDashboardTools(loading.ctx), 'leer_dashboard').run({})).ok).toBe(false)

    const { ctx } = dashboardContext({ getData: () => ({ top_articulos, resumen: {}, comparacion: {}, ventas_hoy: {} }) as never })
    const result = await tool(buildDashboardTools(ctx), 'leer_dashboard').run({})
    expect(result.ok && (result.data as { top_articulos: unknown[] }).top_articulos).toHaveLength(10)
  })

  it('limpiar_filtros_dashboard llama a clear', async () => {
    const { ctx } = dashboardContext()
    await tool(buildDashboardTools(ctx), 'limpiar_filtros_dashboard').run({})
    expect(ctx.clear).toHaveBeenCalled()
  })
})

// -- Reporte de ventas -------------------------------------------------------------------------

function ventasContext(over: Partial<ReporteVentasAgentContext> = {}) {
  const change = vi.fn<(filters: VentasFiltersView) => void>()
  const setTab = vi.fn()
  const download = vi.fn(async () => true)
  const ctx: ReporteVentasAgentContext = {
    getFilters: () => ({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14', id_articulo: 5 }),
    change,
    getOptions: () => ({
      articulos: [{ id: 5, label: 'Camisa' }],
      tallas: [{ id: 9, label: 'M' }],
      sucursales: [{ id: 1, label: 'Centro' }],
    }),
    getTab: () => 'variante',
    setTab,
    getResumen: () => undefined,
    getPorVariante: () => [],
    getPorSucursal: () => [],
    isLoading: () => false,
    isDownloading: () => false,
    download,
    ...over,
  }
  return { ctx, change, setTab, download }
}

describe('reporte de ventas', () => {
  it('filtrar_reporte_ventas pasa el estado completo (fechas a la URL, resto local) y quita con null', async () => {
    const { ctx, change } = ventasContext()
    const def = tool(buildReporteVentasTools(ctx), 'filtrar_reporte_ventas')
    expect((await ejecutar(def, { fecha_hasta: '2026-10-10', sucursal_id: 1, articulo_id: null })).ok).toBe(true)
    expect(change).toHaveBeenCalledWith({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-10',
      id_articulo: undefined,
      id_sucursal: 1,
    })
  })

  it('rechaza ids fuera de las opciones y fechas vacías', async () => {
    const { ctx, change } = ventasContext()
    const def = tool(buildReporteVentasTools(ctx), 'filtrar_reporte_ventas')
    expect((await ejecutar(def, { talla_id: 77 })).ok).toBe(false)
    expect((await ejecutar(def, { fecha_desde: '' })).ok).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  it("cambiar_pestana_reporte_ventas traduce 'sucursales' a la pestaña interna", async () => {
    const { ctx, setTab } = ventasContext()
    const def = tool(buildReporteVentasTools(ctx), 'cambiar_pestana_reporte_ventas')
    expect(def.abreUi).toBe(true)
    await ejecutar(def, { pestana: 'sucursales' })
    expect(setTab).toHaveBeenCalledWith('sucursal')
    expect((await ejecutar(def, { pestana: 'otra' })).ok).toBe(false)
  })

  it('descargar_pdf_reporte_ventas espera a que termine de cargar y reporta el fallo', async () => {
    const loading = ventasContext({ isLoading: () => true })
    expect(errorOf(await ejecutar(tool(buildReporteVentasTools(loading.ctx), 'descargar_pdf_reporte_ventas'), {}))).toMatch(/cargando/)
    expect(loading.download).not.toHaveBeenCalled()

    const failing = ventasContext({ download: async () => false })
    expect((await ejecutar(tool(buildReporteVentasTools(failing.ctx), 'descargar_pdf_reporte_ventas'), {})).ok).toBe(false)
  })
})

// -- Deudores ----------------------------------------------------------------------------------

describe('reporte de deudores', () => {
  const context = (over: Partial<DeudoresAgentContext> = {}) => {
    const setFilters = vi.fn()
    const ctx: DeudoresAgentContext = {
      getFilters: () => ({ nombre: 'ana' }),
      setFilters,
      getClientes: () => [],
      getResumen: () => undefined,
      isLoading: () => false,
      isDownloading: () => false,
      download: async () => true,
      ...over,
    }
    return { ctx, setFilters }
  }

  it('filtrar_deudores combina con el filtro actual y el texto vacío quita el filtro', async () => {
    const { ctx, setFilters } = context()
    const def = tool(buildDeudoresTools(ctx), 'filtrar_deudores')
    await ejecutar(def, { lugar: ' Xela ' })
    expect(setFilters).toHaveBeenCalledWith({ nombre: 'ana', lugar: 'Xela' })
    await ejecutar(def, { nombre: '' })
    expect(setFilters).toHaveBeenLastCalledWith({ nombre: '' })
    expect((await ejecutar(def, {})).ok).toBe(false)
    expect((await ejecutar(def, { nombre: 5 })).ok).toBe(false)
  })

  it('no descarga dos PDFs a la vez', async () => {
    const { ctx } = context({ isDownloading: () => true })
    expect((await ejecutar(tool(buildDeudoresTools(ctx), 'descargar_pdf_deudores'), {})).ok).toBe(false)
  })
})

// -- Cobros ------------------------------------------------------------------------------------

describe('reporte de cobros', () => {
  const porSucursal = [
    {
      id_sucursal: 1,
      nombre: 'Centro',
      total_abonado: 100,
      por_usuario: [{ id_usuario: 7, nombre: 'Ana', cantidad_cobros: 2, total_abonado: 100, total_restante: 5 }],
    },
    {
      id_sucursal: null,
      nombre: 'Sin sucursal',
      total_abonado: 10,
      por_usuario: [{ id_usuario: 8, nombre: 'Luis', cantidad_cobros: 1, total_abonado: 10, total_restante: 0 }],
    },
  ] as never

  const context = (over: Partial<CobrosAgentContext> = {}) => {
    const setFilters = vi.fn()
    const downloadUser = vi.fn(async () => true)
    const ctx: CobrosAgentContext = {
      getFilters: () => ({ nombre: 'an', fecha: '2026-10-10' }),
      setFilters,
      getPorSucursal: () => porSucursal,
      isLoading: () => false,
      isDownloading: () => false,
      download: async () => true,
      downloadUser,
      ...over,
    }
    return { ctx, setFilters, downloadUser }
  }

  it('la fecha puntual es opcional: null la quita, como en la pantalla', async () => {
    const { ctx, setFilters } = context()
    const def = tool(buildCobrosTools(ctx), 'filtrar_cobros')
    await ejecutar(def, { fecha: null })
    expect(setFilters).toHaveBeenCalledWith({ nombre: 'an', fecha: '' })
    await ejecutar(def, { fecha: '2026-10-12' })
    expect(setFilters).toHaveBeenLastCalledWith({ nombre: 'an', fecha: '2026-10-12' })
    expect((await ejecutar(def, { fecha: '2026-13-40' })).ok).toBe(false)
    expect((await ejecutar(def, {})).ok).toBe(false)
  })

  it('descargar_pdf_cobros_usuario valida usuario y sucursal contra el reporte cargado', async () => {
    const { ctx, downloadUser } = context()
    const def = tool(buildCobrosTools(ctx), 'descargar_pdf_cobros_usuario')
    expect((await ejecutar(def, { usuario_id: 7, sucursal_id: 1 })).ok).toBe(true)
    expect(downloadUser).toHaveBeenLastCalledWith(7, 1)
    expect((await ejecutar(def, { usuario_id: 8, sucursal_id: null })).ok).toBe(true)
    expect(downloadUser).toHaveBeenLastCalledWith(8, null)
    expect((await ejecutar(def, { usuario_id: 7, sucursal_id: null })).ok).toBe(false)
    expect((await ejecutar(def, { usuario_id: 99, sucursal_id: 1 })).ok).toBe(false)
  })

  it('leer_cobros acota a 30 usuarios en total', async () => {
    const muchos = [
      {
        id_sucursal: 1,
        nombre: 'Centro',
        total_abonado: 1,
        por_usuario: Array.from({ length: 50 }, (_, i) => ({ id_usuario: i + 1, nombre: `U${i}`, cantidad_cobros: 1, total_abonado: 1, total_restante: 0 })),
      },
    ] as never
    const { ctx } = context({ getPorSucursal: () => muchos })
    const result = await tool(buildCobrosTools(ctx), 'leer_cobros').run({})
    const sucursales = result.ok ? (result.data as { sucursales: { usuarios: unknown[] }[] }).sucursales : []
    expect(sucursales[0].usuarios).toHaveLength(30)
  })
})

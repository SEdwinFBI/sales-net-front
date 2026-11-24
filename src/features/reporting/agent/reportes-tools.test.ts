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

  describe('ventas globales, POS y de la ficha del cliente', () => {
    const por_origen = {
      global: { cantidad_ventas: 83, total_neto: 51202, efectivo: 29001, credito: 22201 },
      pos: { cantidad_ventas: 59, total_neto: 28591, efectivo: 28591, credito: 0, total_bruto: 30000, total_descuento: 1409 },
      cliente: { cantidad_ventas: 24, total_neto: 22611, efectivo: 410, credito: 22201 },
    }
    const dato = {
      resumen: { total_neto: 28591, por_origen },
      comparacion: { ven_mes_anterior: 3, por_origen: { global: { ven_mes_anterior: 5 } } },
      ventas_hoy: { total_neto: 100, por_origen: { global: { total_neto: 150 } } },
      top_sucursales: [{ id_sucursal: 1, nombre: 'Centro', total_neto: 20, total_cliente: 30, total_global: 50 }],
      formas_pago: [{ nombre: 'Efectivo', total_neto: 28591 }],
      formas_pago_global: [{ nombre: 'Credito', total_neto: 22201 }, { nombre: 'Efectivo', total_neto: 29001 }],
    }

    it('leer_dashboard devuelve global, POS y cliente en el resumen, hoy, comparacion y sucursales', async () => {
      const { ctx } = dashboardContext({ getData: () => dato as never })
      const result = await tool(buildDashboardTools(ctx), 'leer_dashboard').run({})
      type Dato = {
        kpis: { por_origen: { global: unknown; cliente: { total_neto: number } } }
        ventas_hoy: { por_origen: { global: { total_neto: number } } }
        comparacion: { por_origen: { global: { ven_mes_anterior: number } } }
        top_sucursales: unknown[]
        formas_pago: { nombre: string }[]
      }
      const data = (result.ok ? result.data : {}) as Dato
      expect(data.kpis.por_origen.global).toMatchObject({ cantidad_ventas: 83, total_neto: 51202 })
      expect(data.kpis.por_origen.cliente.total_neto).toBe(22611)
      expect(data.ventas_hoy.por_origen.global.total_neto).toBe(150)
      expect(data.comparacion.por_origen.global.ven_mes_anterior).toBe(5)
      expect(data.top_sucursales[0]).toMatchObject({ total_cliente: 30, total_global: 50 })
      expect(data.formas_pago.map((f) => f.nombre)).toEqual(['Credito', 'Efectivo'])
      expect(data).not.toHaveProperty('alcance')
    })

    it('con filtro de articulo o talla llega la nota y el cliente es null', async () => {
      const nota = 'Con filtro de articulo o talla solo cuentan las ventas del POS.'
      const filtrado = { ...dato, resumen: { total_neto: 5, por_origen: { ...por_origen, cliente: null, nota } } }
      const { ctx } = dashboardContext({ getData: () => filtrado as never })
      const result = await tool(buildDashboardTools(ctx), 'leer_dashboard').run({})
      expect(result).toMatchObject({ ok: true, data: { nota, kpis: { por_origen: { cliente: null } } } })
    })

    it('la descripcion dice que global es el defecto y que por articulo o talla solo hay POS', () => {
      const { ctx } = dashboardContext()
      const description = tool(buildDashboardTools(ctx), 'leer_dashboard').description
      expect(description).toMatch(/usa global \(tambien por sucursal o cliente\) salvo que el usuario pida explicitamente POS o registradas en cliente/i)
      expect(description).toMatch(/por articulo o talla solo hay POS/)
      expect(description.length).toBeLessThanOrEqual(300)
    })
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

  it('leer_reporte_ventas da por_origen en el resumen y global, POS y cliente por sucursal', async () => {
    const resumen = {
      total_neto: 28591,
      por_origen: {
        global: { cantidad_ventas: 83, total_neto: 51202, efectivo: 0, credito: 22201 },
        pos: { cantidad_ventas: 59, total_neto: 28591, efectivo: 0, credito: 0 },
        cliente: { cantidad_ventas: 24, total_neto: 22611, efectivo: 0, credito: 22201 },
      },
    }
    const sucursales = [
      { id_sucursal: 1, nombre: 'Centro', cantidad_ventas: 5, unidades: 9, total_neto: 100, total_cliente: 40, cantidad_ventas_cliente: 2, total_global: 140, articulos: [] },
      { id_sucursal: 2, nombre: 'Norte', cantidad_ventas: 1, unidades: 1, total_neto: 10, articulos: [] },
    ]
    const { ctx } = ventasContext({ getTab: () => 'sucursal', getResumen: () => resumen as never, getPorSucursal: () => sucursales as never })
    const result = await tool(buildReporteVentasTools(ctx), 'leer_reporte_ventas').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        resumen: { por_origen: { global: { total_neto: 51202 }, pos: { total_neto: 28591 }, cliente: { total_neto: 22611 } } },
        sucursales: [
          { nombre: 'Centro', total_pos: 100, total_cliente: 40, ventas_cliente: 2, total_global: 140 },
          { nombre: 'Norte', total_pos: 10, total_cliente: null, total_global: 10 },
        ],
      },
    })
    expect(result.ok && result.data).not.toHaveProperty('alcance')
  })

  it('leer_reporte_ventas pasa la nota del filtro de articulo o talla y su descripcion fija el defecto', async () => {
    const nota = 'Con filtro de articulo o talla solo cuentan las ventas del POS.'
    const { ctx } = ventasContext({ getResumen: () => ({ total_neto: 5, por_origen: { cliente: null, nota } }) as never })
    const def = tool(buildReporteVentasTools(ctx), 'leer_reporte_ventas')
    expect(await def.run({})).toMatchObject({ ok: true, data: { nota } })
    expect(def.description).toMatch(/usa global \(tambien por sucursal o cliente\) salvo que el usuario pida explicitamente POS o registradas en cliente/i)
    expect(def.description).toMatch(/por articulo o talla solo hay POS/)
    expect(def.description.length).toBeLessThanOrEqual(300)
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

  describe('preguntas sobre un cliente', () => {
    type Leida = {
      total_abonado?: number
      sugerencia?: string
      filtros: { vendedor: string; fecha: string }
      total_cobrado?: number
      total_clientes_encontrados?: number
      clientes?: { nombre: string; total_cobrado: number; cantidad_cobros: number; cobrado_por: { vendedor: string; sucursal: string }[]; cobros: unknown[] }[]
      sucursales?: { usuarios: { top_clientes: { nombre: string }[]; clientes_omitidos: number }[] }[]
    }
    const cobro = (id: number, clienteId: number, nombre: string, monto: number) => ({
      id_abono: id,
      fecha_abono: '2026-11-22',
      id_venta: id * 10,
      monto,
      saldo_restante: 20,
      cliente: { id: clienteId, nombre_completo: nombre },
    })
    const conClientes = [
      {
        id_sucursal: 1,
        nombre: 'Centro',
        total_abonado: 170,
        por_usuario: [
          { id_usuario: 7, nombre: 'Ana', cantidad_cobros: 3, total_abonado: 150, total_restante: 40, cobros: [cobro(1, 50, 'Sheny Lopez', 100), cobro(2, 51, 'Pedro Ruiz', 20), cobro(3, 50, 'Sheny Lopez', 30)] },
          { id_usuario: 9, nombre: 'Marta', cantidad_cobros: 1, total_abonado: 20, total_restante: 0, clientes: [{ id_cliente: 50, nombre_completo: 'Sheny Lopez', total_cobrado: 20, cantidad_cobros: 1, saldo_restante: 0 }] },
        ],
      },
    ] as never
    const leer = async (args: Record<string, unknown>, over: Partial<CobrosAgentContext> = {}) => {
      const { ctx } = context({ getPorSucursal: () => conClientes, getFilters: () => ({}), ...over })
      const result = await ejecutar(tool(buildCobrosTools(ctx), 'leer_cobros'), args)
      if (!result.ok) throw new Error(errorOf(result))
      return result.data as Leida
    }

    it('filtrar_cobros recibe el vendedor (no un cliente) y lo manda como nombre del API', async () => {
      const { ctx, setFilters } = context()
      const def = tool(buildCobrosTools(ctx), 'filtrar_cobros')
      expect(def.description).toMatch(/NO filtra por cliente/)
      const result = await ejecutar(def, { vendedor: ' Ana ' })
      expect(setFilters).toHaveBeenCalledWith({ nombre: 'Ana', fecha: '2026-10-10' })
      expect(result).toMatchObject({ ok: true, data: { filtros: { vendedor: 'Ana', fecha: '2026-10-10' } } })
      expect(errorOf(await ejecutar(def, { nombre: 'Sheny' }))).toMatch(/vendedor/)
      expect((await ejecutar(def, { vendedor: 5 })).ok).toBe(false)
    })

    it('leer_cobros con cliente suma lo que cobro cada vendedor y dice quien cobro', async () => {
      const data = await leer({ cliente: 'sheny' })
      expect(data.total_clientes_encontrados).toBe(1)
      expect(data.total_cobrado).toBe(150)
      expect(data.clientes?.[0]).toMatchObject({ nombre: 'Sheny Lopez', total_cobrado: 150, cantidad_cobros: 3 })
      expect(data.clientes?.[0].cobrado_por.map((c) => c.vendedor + '/' + c.sucursal)).toEqual(['Ana/Centro', 'Marta/Centro'])
      expect(data.clientes?.[0].cobros).toHaveLength(2)
      expect(data.sugerencia).toBeUndefined()
    })

    it('leer_cobros con cliente tolera el nombre mal dictado', async () => {
      expect((await leer({ cliente: 'Cheni Lopes' })).total_clientes_encontrados).toBe(1)
    })

    it('sin coincidencias dice que el vendedor filtrado puede ser el motivo', async () => {
      const data = await leer({ cliente: 'Zoila' }, { getFilters: () => ({ nombre: 'Sheny', fecha: '2026-11-22' }) })
      expect(data.clientes).toEqual([])
      expect(data.sugerencia).toMatch(/filtro de vendedor \('Sheny'\)/)
      expect(data.sugerencia).toMatch(/2026-11-22/)
    })

    it('sin cobros y con un vendedor filtrado sugiere que ese nombre quiza es un cliente', async () => {
      const data = await leer({}, { getPorSucursal: () => [], getFilters: () => ({ nombre: 'Sheny' }) })
      expect(data.sugerencia).toBe(
        "Sin cobros del vendedor 'Sheny'. Si 'Sheny' es un cliente, quita el filtro con filtrar_cobros({vendedor:''}) y usa leer_cobros({cliente:'Sheny'}), o buscar_cliente y su ficha.",
      )
    })

    it('rechaza un cliente vacio', async () => {
      const { ctx } = context({ getPorSucursal: () => conClientes })
      expect((await ejecutar(tool(buildCobrosTools(ctx), 'leer_cobros'), { cliente: '  ' })).ok).toBe(false)
    })

    it('sin cliente devuelve el top de clientes por vendedor y el total calculado', async () => {
      const data = await leer({})
      expect(data.total_abonado).toBe(170)
      const [ana, marta] = data.sucursales?.[0].usuarios ?? []
      expect(ana.top_clientes.map((c) => c.nombre)).toEqual(['Sheny Lopez', 'Pedro Ruiz'])
      expect(marta.top_clientes.map((c) => c.nombre)).toEqual(['Sheny Lopez'])
    })

    it('acota los clientes del resumen para no pasar el limite del back', async () => {
      const clientes = Array.from({ length: 10 }, (_, i) => ({ id_cliente: i + 1, nombre_completo: `Cliente ${i}`, total_cobrado: 10 - i }))
      const muchos = [{ id_sucursal: 1, nombre: 'Centro', total_abonado: 1, por_usuario: Array.from({ length: 30 }, (_, i) => ({ id_usuario: i + 1, nombre: `U${i}`, cantidad_cobros: 1, total_abonado: 1, total_restante: 0, clientes })) }] as never
      const data = await leer({}, { getPorSucursal: () => muchos })
      const usuarios = data.sucursales?.[0].usuarios ?? []
      expect(usuarios.reduce((n, u) => n + u.top_clientes.length, 0)).toBe(25)
      expect(usuarios[0]).toMatchObject({ clientes_omitidos: 7 })
      expect(JSON.stringify(data).length).toBeLessThan(8000)
    })
  })
})

describe('opciones de los filtros (de donde salen los ids)', () => {
  it('opciones_filtros_dashboard da sucursales, articulos acotados por texto y las tallas del articulo filtrado', async () => {
    const { ctx } = dashboardContext()
    const def = tool(buildDashboardTools(ctx), 'opciones_filtros_dashboard')
    expect(await def.run({ texto: 'panta' })).toEqual({
      ok: true,
      data: {
        sucursales: [{ id: 1, nombre: 'Centro' }],
        total_articulos: 1,
        articulos: [{ id: 6, titulo: 'Pantalon' }],
        tallas_del_articulo_filtrado: [
          { id: 9, nombre: 'M' },
          { id: 10, nombre: 'L' },
        ],
      },
    })
  })

  it('opciones_filtros_reporte_ventas da articulos, tallas y sucursales con id', async () => {
    const { ctx } = ventasContext()
    expect(await tool(buildReporteVentasTools(ctx), 'opciones_filtros_reporte_ventas').run({})).toEqual({
      ok: true,
      data: {
        total_articulos: 1,
        articulos: [{ id: 5, nombre: 'Camisa' }],
        tallas: [{ id: 9, nombre: 'M' }],
        sucursales: [{ id: 1, nombre: 'Centro' }],
      },
    })
  })
})

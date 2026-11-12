import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Movimiento, ResumenFilaExistencias } from '../types/inventario'
import { TIPOS_STOCK } from '../utils/tipos-movimiento'
import { buildMovimientosTools, type MovimientosAgentContext } from './movimientos-tools'
import { buildResumenTools, type ResumenAgentContext } from './resumen-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}

const TODAY = '2026-10-14'

const movimiento = (id: number, extra: Partial<Movimiento> = {}): Movimiento =>
  ({
    id,
    modulo: 'STOCK',
    modulo_display: 'Stock',
    tipo: 'STOCK_VENTA',
    tipo_display: 'Salida por venta',
    fecha: '2026-10-14T09:00:00',
    total: '0',
    total_unidades: -2,
    referencia: 'V-1',
    observacion: null,
    id_venta: 7,
    sucursal_afectada: { id: 1, nombre: 'Centro' },
    usuario_registra: { id: 5, username: 'ana', full_name: 'Ana Pérez' },
    cliente: null,
    detalles: [
      { id: 1, id_variante: 11, id_articulo: 1, articulo: 'Camisa', talla: 'M', id_cliente: null, cantidad: -2, cantidad_anterior: 10, cantidad_resultante: 8 },
    ],
    ...extra,
  }) as unknown as Movimiento

function movCtx(overrides: Partial<MovimientosAgentContext> = {}) {
  return {
    getFilters: vi.fn(() => ({ page: 1, modulo: 'STOCK' as const, fecha_desde: TODAY, fecha_hasta: TODAY })),
    setFilters: vi.fn(),
    resetFilters: vi.fn(),
    getOptions: () => ({
      tipos: TIPOS_STOCK,
      sucursales: [{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Norte' }],
      usuarios: [{ id: 5, nombre: 'Ana Pérez' }],
    }),
    getMovimientos: () => [movimiento(1), movimiento(2, { tipo: 'STOCK_RESURTIDO', tipo_display: 'Resurtido', total_unidades: 5, id_venta: null })],
    getPagination: () => ({ page: 1, page_size: 10, total: 2, total_pages: 1, next: null, previous: null }),
    isLoading: () => false,
    isDownloading: () => false,
    download: vi.fn(async () => true),
    today: () => TODAY,
    ...overrides,
  } satisfies MovimientosAgentContext
}

describe('filtrar_movimientos', () => {
  const def = (ctx = movCtx()) => tool(buildMovimientosTools(ctx), 'filtrar_movimientos')

  it('aplica fechas, tipo, sucursal y usuario y vuelve a la página 1', async () => {
    const ctx = movCtx()
    const result = await ejecutar(def(ctx), {
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-10',
      tipo: 'stock_resurtido',
      sucursal_id: 2,
      usuario_id: 5,
    })
    expect(result.ok).toBe(true)
    expect(ctx.setFilters).toHaveBeenCalledWith({
      page: 1,
      modulo: 'STOCK',
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-10',
      tipo: 'STOCK_RESURTIDO',
      id_sucursal: 2,
      id_usuario: 5,
    })
  })

  it('el tipo también se acepta por su nombre visible', async () => {
    const ctx = movCtx()
    await ejecutar(def(ctx), { tipo: 'Resurtido' })
    expect(ctx.setFilters).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'STOCK_RESURTIDO' }))
  })

  it("null y 'todos' quitan tipo, sucursal y usuario", async () => {
    const ctx = movCtx({ getFilters: () => ({ page: 3, modulo: 'STOCK', fecha_desde: TODAY, fecha_hasta: TODAY, tipo: 'STOCK_VENTA', id_sucursal: 1, id_usuario: 5 }) })
    await ejecutar(def(ctx), { tipo: 'todos', sucursal_id: null, usuario_id: null })
    expect(ctx.setFilters).toHaveBeenCalledWith({ page: 1, modulo: 'STOCK', fecha_desde: TODAY, fecha_hasta: TODAY, tipo: undefined, id_sucursal: undefined, id_usuario: undefined })
  })

  it('las fechas nunca quedan vacías, inválidas ni invertidas', async () => {
    const ctx = movCtx()
    for (const args of [{ fecha_desde: '' }, { fecha_hasta: null }, { fecha_desde: '2026-02-30' }, { fecha_desde: '2026-11-01' }]) {
      expect((await ejecutar(def(ctx), args)).ok, JSON.stringify(args)).toBe(false)
    }
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })

  it('si el filtro no trae fechas se parte de hoy (como la pantalla)', async () => {
    const ctx = movCtx({ getFilters: () => ({ page: 1, modulo: 'STOCK' }) })
    await ejecutar(def(ctx), { fecha_desde: '2026-10-14' })
    expect(ctx.setFilters).toHaveBeenCalledWith(expect.objectContaining({ fecha_desde: TODAY, fecha_hasta: TODAY }))
  })

  it('tipo, sucursal y usuario deben existir en las opciones', async () => {
    const ctx = movCtx()
    const malos = await Promise.all([
      ejecutar(def(ctx), { tipo: 'inventado' }),
      ejecutar(def(ctx), { sucursal_id: 99 }),
      ejecutar(def(ctx), { usuario_id: 99 }),
      ejecutar(def(ctx), { sucursal_id: 'x' }),
      ejecutar(def(ctx), {}),
    ])
    for (const m of malos) expect(m.ok).toBe(false)
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })

  it('un filtro inválido no aplica los demás', async () => {
    const ctx = movCtx()
    expect((await ejecutar(def(ctx), { sucursal_id: 1, usuario_id: 99 })).ok).toBe(false)
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })
})

describe('otras tools de movimientos', () => {
  it('opciones_filtros_movimientos devuelve tipos, sucursales y usuarios con id y nombre', async () => {
    const result = await tool(buildMovimientosTools(movCtx()), 'opciones_filtros_movimientos').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        tipos: expect.arrayContaining([{ valor: 'STOCK_RESURTIDO', nombre: 'Resurtido' }]),
        sucursales: [{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Norte' }],
        usuarios: [{ id: 5, nombre: 'Ana Pérez' }],
      },
    })
    // la opción vacía "Todos los tipos" no es un tipo
    expect((result as { data: { tipos: { valor: string }[] } }).data.tipos.some((t) => t.valor === '')).toBe(false)
  })

  it('limpiar_filtros_movimientos vuelve las fechas a hoy', async () => {
    const ctx = movCtx()
    const result = await tool(buildMovimientosTools(ctx), 'limpiar_filtros_movimientos').run({})
    expect(ctx.resetFilters).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('fechas vuelven a hoy') } })
  })

  it('leer_movimientos resume la página con sus detalles antes/después', async () => {
    const result = await tool(buildMovimientosTools(movCtx()), 'leer_movimientos').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        pagina: 1,
        paginas: 1,
        total: 2,
        movimientos: [
          {
            id: 1,
            tipo: 'STOCK_VENTA',
            sucursal: 'Centro',
            registro: 'Ana Pérez',
            total_unidades: -2,
            id_venta: 7,
            detalles: [{ articulo: 'Camisa', talla: 'M', cantidad: -2, antes: 10, despues: 8 }],
          },
          { id: 2, tipo: 'STOCK_RESURTIDO' },
        ],
      },
    })
  })

  it('limita las filas y los detalles que se mandan al modelo', async () => {
    const detalle = (i: number) => ({ id: i, id_variante: i, id_articulo: 1, articulo: 'A', talla: 'M', id_cliente: null, cantidad: 1, cantidad_anterior: 0, cantidad_resultante: 1 })
    const muchos = Array.from({ length: 80 }, (_, i) => movimiento(i + 1, { detalles: Array.from({ length: 9 }, (_, j) => detalle(j)) }))
    const result = await tool(buildMovimientosTools(movCtx({ getMovimientos: () => muchos })), 'leer_movimientos').run({})
    const data = (result as { data: { mostrando: number; movimientos: { detalles: unknown[]; detalles_totales: number }[] } }).data
    expect(data.mostrando).toBe(30)
    expect(data.movimientos).toHaveLength(30)
    expect(data.movimientos[0].detalles).toHaveLength(5)
    expect(data.movimientos[0].detalles_totales).toBe(9)
  })

  describe('descargar_pdf_movimientos', () => {
    it('descarga con los filtros actuales', async () => {
      const ctx = movCtx()
      expect((await ejecutar(tool(buildMovimientosTools(ctx), 'descargar_pdf_movimientos'), {})).ok).toBe(true)
      expect(ctx.download).toHaveBeenCalledOnce()
    })

    it('no descarga mientras carga o ya se genera, y reporta un fallo', async () => {
      for (const o of [{ isLoading: () => true }, { isDownloading: () => true }]) {
        const ctx = movCtx(o)
        expect((await ejecutar(tool(buildMovimientosTools(ctx), 'descargar_pdf_movimientos'), {})).ok).toBe(false)
        expect(ctx.download).not.toHaveBeenCalled()
      }
      const falla = movCtx({ download: vi.fn(async () => false) })
      expect(await ejecutar(tool(buildMovimientosTools(falla), 'descargar_pdf_movimientos'), {})).toMatchObject({ ok: false, error: 'No se pudo descargar el PDF.' })
    })
  })
})

// -- resumen ------------------------------------------------------------------------------------

const fila = (id: number, extra: Partial<ResumenFilaExistencias> = {}): ResumenFilaExistencias => ({
  id_variante: id,
  id_articulo: 1,
  articulo: 'Camisa',
  talla: 'M',
  id_sucursal: 1,
  sucursal: 'Centro',
  habia: 10,
  entradas: 5,
  salidas: 3,
  vendido: 2,
  hay: 12,
  ...extra,
})

function resCtx(overrides: Partial<ResumenAgentContext> = {}) {
  let incluir = false
  return {
    getFilters: vi.fn(() => ({ fecha_desde: TODAY, fecha_hasta: TODAY })),
    setFilters: vi.fn(),
    getSucursales: () => [{ id: 1, nombre: 'Centro' }],
    getClientes: () => [{ id: 3, nombre: 'María López' }],
    getIncluirDetalle: () => incluir,
    setIncluirDetalle: vi.fn((value: boolean) => { incluir = value }),
    getResumen: () => [fila(11), fila(12, { talla: 'L', hay: 0 })],
    getTotales: () => ({ habia: 20, entradas: 10, salidas: 6, vendido: 4, hay: 24 }),
    isLoading: () => false,
    isDownloading: () => false,
    download: vi.fn(async () => true),
    today: () => TODAY,
    ...overrides,
  } satisfies ResumenAgentContext
}

describe('tools de /inventario/resumen', () => {
  const def = (name: string, ctx = resCtx()) => tool(buildResumenTools(ctx), name)

  describe('filtrar_resumen', () => {
    it('aplica fechas, sucursal y cliente', async () => {
      const ctx = resCtx()
      const result = await ejecutar(def('filtrar_resumen', ctx), { fecha_desde: '2026-10-01', sucursal_id: 1, cliente_id: 3 })
      expect(ctx.setFilters).toHaveBeenCalledWith({ fecha_desde: '2026-10-01', fecha_hasta: TODAY, id_sucursal: 1, id_cliente: 3 })
      expect(result).toMatchObject({ ok: true, data: { filtros: { sucursal_id: 1, cliente_id: 3 } } })
      expect(result).not.toMatchObject({ data: { aviso: expect.anything() } })
    })

    it('un cliente fuera del selector (solo lista 10) se acepta pero se avisa', async () => {
      const ctx = resCtx()
      const result = await ejecutar(def('filtrar_resumen', ctx), { cliente_id: 999 })
      expect(ctx.setFilters).toHaveBeenCalledWith(expect.objectContaining({ id_cliente: 999 }))
      expect(result).toMatchObject({ ok: true, data: { aviso: expect.stringContaining('solo lista 10 clientes') } })
    })

    it('null quita sucursal y cliente', async () => {
      const ctx = resCtx({ getFilters: () => ({ fecha_desde: TODAY, fecha_hasta: TODAY, id_sucursal: 1, id_cliente: 3 }) })
      await ejecutar(def('filtrar_resumen', ctx), { sucursal_id: null, cliente_id: null })
      expect(ctx.setFilters).toHaveBeenCalledWith({ fecha_desde: TODAY, fecha_hasta: TODAY, id_sucursal: undefined, id_cliente: undefined })
    })

    it('las fechas nunca quedan vacías; la sucursal debe existir; el cliente debe ser un id', async () => {
      const ctx = resCtx()
      for (const args of [{}, { fecha_desde: '' }, { fecha_hasta: '2026-13-01' }, { fecha_desde: '2026-11-01' }, { sucursal_id: 99 }, { cliente_id: 'x' }, { cliente_id: -3 }]) {
        expect((await ejecutar(def('filtrar_resumen', ctx), args)).ok, JSON.stringify(args)).toBe(false)
      }
      expect(ctx.setFilters).not.toHaveBeenCalled()
    })
  })

  it('incluir_detalle_pdf activa y desactiva, y exige un booleano', async () => {
    const ctx = resCtx()
    const d = def('incluir_detalle_pdf', ctx)
    expect(await ejecutar(d, { incluir: true })).toMatchObject({ ok: true, data: { incluir_detalle: true } })
    expect(ctx.setIncluirDetalle).toHaveBeenCalledWith(true)
    for (const incluir of ['si', 1, null, undefined]) expect((await ejecutar(d, { incluir })).ok, String(incluir)).toBe(false)
    expect(ctx.setIncluirDetalle).toHaveBeenCalledTimes(1)
  })

  it('leer_resumen devuelve filas y totales (había + entradas − salidas = hay)', async () => {
    const result = await def('leer_resumen').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        total: 2,
        incluir_detalle_pdf: false,
        totales: { habia: 20, entradas: 10, salidas: 6, vendido: 4, hay: 24 },
        filas: [
          { variante_id: 11, articulo: 'Camisa', talla: 'M', sucursal: 'Centro', habia: 10, entradas: 5, salidas: 3, vendido: 2, hay: 12 },
          { variante_id: 12, talla: 'L', hay: 0 },
        ],
      },
    })
  })

  it('leer_resumen limita a 30 filas', async () => {
    const muchas = Array.from({ length: 70 }, (_, i) => fila(i + 1))
    const result = await def('leer_resumen', resCtx({ getResumen: () => muchas })).run({})
    expect(result).toMatchObject({ data: { total: 70, mostrando: 30 } })
  })

  it('descargar_pdf_resumen descarga, y no mientras carga o ya se genera', async () => {
    const ctx = resCtx()
    expect((await ejecutar(def('descargar_pdf_resumen', ctx), {})).ok).toBe(true)
    expect(ctx.download).toHaveBeenCalledOnce()
    for (const o of [{ isLoading: () => true }, { isDownloading: () => true }]) {
      const c = resCtx(o)
      expect((await ejecutar(def('descargar_pdf_resumen', c), {})).ok).toBe(false)
      expect(c.download).not.toHaveBeenCalled()
    }
    const falla = resCtx({ download: vi.fn(async () => false) })
    expect((await ejecutar(def('descargar_pdf_resumen', falla), {})).ok).toBe(false)
  })
})

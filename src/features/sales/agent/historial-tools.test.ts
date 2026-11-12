import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Venta } from '../types/sales'
import {
  buildHistorialPageTools,
  buildHistorialTableTools,
  type HistorialPageAgentContext,
  type HistorialTableAgentContext,
} from './historial-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}

const venta = (id: number, extra: Partial<Venta> = {}): Venta =>
  ({
    id,
    fecha: '2026-10-10T10:00:00',
    total: 100,
    total_neto: 90,
    total_descuento: 10,
    estado: 'PAGADA',
    forma_pago: 'Efectivo',
    abonado: 90,
    saldo: 0,
    foto_url: null,
    sucursal: { id: 1, nombre: 'Centro' },
    vendedor: { id: 2, username: 'ana', full_name: 'Ana Pérez' },
    cliente_info: { id: 3, nombre_completo: 'María López', telefono: '5555', balance: 0 },
    detalles: [],
    ...extra,
  }) as unknown as Venta

// -- página -----------------------------------------------------------------------------------------

function pageCtx(overrides: Partial<HistorialPageAgentContext> = {}) {
  return {
    getFilters: vi.fn(() => ({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14', texto: '' })),
    getOptions: () => ({ estados: ['PAGADA', 'PENDIENTE', 'REVERTIDA'], formasPago: ['Efectivo', 'Crédito'] }),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    getFilteredVentas: () => [venta(1), venta(2, { estado: 'PENDIENTE', saldo: 40, foto_url: 'http://x/f.jpg' })],
    isLoading: () => false,
    isExporting: () => false,
    exportPdf: vi.fn(async () => true),
    ...overrides,
  } satisfies HistorialPageAgentContext
}

describe('filtrar_historial', () => {
  const def = (ctx = pageCtx()) => tool(buildHistorialPageTools(ctx), 'filtrar_historial')

  it('aplica fechas, estado, forma de pago y texto', async () => {
    const ctx = pageCtx()
    const result = await ejecutar(def(ctx), {
      fecha_desde: '2026-10-05',
      fecha_hasta: '2026-10-10',
      estado: 'pendiente',
      forma_pago: 'credito',
      texto: ' maría ',
    })
    expect(result.ok).toBe(true)
    expect(ctx.setFilters).toHaveBeenCalledWith({
      fecha_desde: '2026-10-05',
      fecha_hasta: '2026-10-10',
      estado: 'PENDIENTE', // valor canónico de la lista
      forma_pago: 'Crédito',
      texto: 'maría',
    })
  })

  it('una sola fecha se combina con la otra actual', async () => {
    const ctx = pageCtx()
    await ejecutar(def(ctx), { fecha_desde: '2026-10-10' })
    expect(ctx.setFilters).toHaveBeenCalledWith({ fecha_desde: '2026-10-10', fecha_hasta: '2026-10-14' })
  })

  it('las fechas nunca pueden quedar vacías ni inválidas', async () => {
    const ctx = pageCtx()
    for (const args of [{ fecha_desde: '' }, { fecha_hasta: null }, { fecha_desde: '2026-02-30' }, { fecha_hasta: 'hoy' }]) {
      expect((await ejecutar(def(ctx), args)).ok, JSON.stringify(args)).toBe(false)
    }
    expect((await ejecutar(def(ctx), { fecha_desde: '2026-11-01' })).ok).toBe(false) // posterior a fecha_hasta
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })

  it("'todos' y 'todas' quitan estado y forma de pago", async () => {
    const ctx = pageCtx()
    await ejecutar(def(ctx), { estado: 'todos', forma_pago: 'todas' })
    expect(ctx.setFilters).toHaveBeenCalledWith({ estado: undefined, forma_pago: undefined })
  })

  it('un estado o forma de pago que no existe se rechaza listando las opciones', async () => {
    const ctx = pageCtx()
    const malo = await ejecutar(def(ctx), { estado: 'inventado' })
    expect(malo).toMatchObject({ ok: false, error: expect.stringContaining('PAGADA, PENDIENTE, REVERTIDA') })
    expect((await ejecutar(def(ctx), { forma_pago: 'cheque' })).ok).toBe(false)
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })

  it('sin ningún filtro o con un texto que no es texto falla', async () => {
    const ctx = pageCtx()
    expect((await ejecutar(def(ctx), {})).ok).toBe(false)
    expect((await ejecutar(def(ctx), { texto: 5 })).ok).toBe(false)
  })

  it('una falla de validación en un filtro no aplica los otros', async () => {
    const ctx = pageCtx()
    expect((await ejecutar(def(ctx), { texto: 'ana', estado: 'inventado' })).ok).toBe(false)
    expect(ctx.setFilters).not.toHaveBeenCalled()
  })
})

describe('otras tools de la página', () => {
  it('limpiar_filtros_historial conserva las fechas', async () => {
    const ctx = pageCtx()
    const result = await tool(buildHistorialPageTools(ctx), 'limpiar_filtros_historial').run({})
    expect(ctx.clearFilters).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('fechas se conservan') } })
  })

  it('leer_historial resume las ventas filtradas (máx. 30) con sus opciones', async () => {
    const result = await tool(buildHistorialPageTools(pageCtx()), 'leer_historial').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        total: 2,
        cargando: false,
        opciones: { estados: ['PAGADA', 'PENDIENTE', 'REVERTIDA'] },
        ventas: [
          { id: 1, cliente: 'María López', vendedor: 'Ana Pérez', sucursal: 'Centro', total_neto: 90, estado: 'PAGADA', tiene_foto: false },
          { id: 2, saldo: 40, tiene_foto: true },
        ],
      },
    })

    const muchas = Array.from({ length: 70 }, (_, i) => venta(i + 1))
    const limitado = await tool(buildHistorialPageTools(pageCtx({ getFilteredVentas: () => muchas })), 'leer_historial').run({})
    expect(limitado).toMatchObject({ data: { total: 70, mostrando: 30 } })
  })

  describe('descargar_pdf_historial', () => {
    it('descarga cuando hay ventas', async () => {
      const ctx = pageCtx()
      const result = await ejecutar(tool(buildHistorialPageTools(ctx), 'descargar_pdf_historial'), {})
      expect(ctx.exportPdf).toHaveBeenCalledOnce()
      expect(result).toMatchObject({ ok: true })
    })

    it('no descarga sin ventas ni mientras ya se genera', async () => {
      const vacio = pageCtx({ getFilteredVentas: () => [] })
      expect((await ejecutar(tool(buildHistorialPageTools(vacio), 'descargar_pdf_historial'), {})).ok).toBe(false)
      const ocupado = pageCtx({ isExporting: () => true })
      expect((await ejecutar(tool(buildHistorialPageTools(ocupado), 'descargar_pdf_historial'), {})).ok).toBe(false)
      expect(vacio.exportPdf).not.toHaveBeenCalled()
      expect(ocupado.exportPdf).not.toHaveBeenCalled()
    })

    it('si la descarga falla lo dice', async () => {
      const ctx = pageCtx({ exportPdf: vi.fn(async () => false) })
      expect(await ejecutar(tool(buildHistorialPageTools(ctx), 'descargar_pdf_historial'), {})).toMatchObject({
        ok: false,
        error: 'No se pudo descargar el PDF.',
      })
    })
  })
})

// -- tabla ------------------------------------------------------------------------------------------

function tableCtx(overrides: Partial<HistorialTableAgentContext> = {}) {
  return {
    getVentas: () => [venta(1), venta(2, { foto_url: 'http://x/f.jpg' }), venta(3, { estado: 'REVERTIDA' })],
    getUser: () => ({ role: 'vendedor' as const, puede_anular: true }),
    isDialogOpen: vi.fn(() => false),
    showDetalle: vi.fn(() => true),
    openFoto: vi.fn(),
    openAnular: vi.fn(),
    ...overrides,
  } satisfies HistorialTableAgentContext
}

describe('tools de la tabla del historial', () => {
  it('ver_detalle_venta expande la fila y avisa si los filtros de columna la ocultan', async () => {
    const ctx = tableCtx()
    expect((await ejecutar(tool(buildHistorialTableTools(ctx), 'ver_detalle_venta'), { venta_id: 2 })).ok).toBe(true)
    expect(ctx.showDetalle).toHaveBeenCalledWith(2)

    const oculta = tableCtx({ showDetalle: vi.fn(() => false) })
    expect(await ejecutar(tool(buildHistorialTableTools(oculta), 'ver_detalle_venta'), { venta_id: 2 })).toMatchObject({
      ok: false,
      error: expect.stringContaining('filtros de columna'),
    })
  })

  it('una venta que no está en la lista filtrada no se toca', async () => {
    const ctx = tableCtx()
    for (const name of ['ver_detalle_venta', 'ver_foto_venta', 'abrir_anular_venta']) {
      expect((await ejecutar(tool(buildHistorialTableTools(ctx), name), { venta_id: 999 })).ok, name).toBe(false)
    }
    expect(ctx.showDetalle).not.toHaveBeenCalled()
    expect(ctx.openFoto).not.toHaveBeenCalled()
    expect(ctx.openAnular).not.toHaveBeenCalled()
  })

  describe('ver_foto_venta', () => {
    it('abre la foto de una venta que la tiene', async () => {
      const ctx = tableCtx()
      expect((await ejecutar(tool(buildHistorialTableTools(ctx), 'ver_foto_venta'), { venta_id: 2 })).ok).toBe(true)
      expect(ctx.openFoto).toHaveBeenCalledOnce()
    })

    it('explica cuando la venta no tiene foto', async () => {
      const ctx = tableCtx()
      expect(await ejecutar(tool(buildHistorialTableTools(ctx), 'ver_foto_venta'), { venta_id: 1 })).toMatchObject({
        ok: false,
        error: expect.stringContaining('no tiene foto'),
      })
      expect(ctx.openFoto).not.toHaveBeenCalled()
    })
  })

  describe('abrir_anular_venta', () => {
    it('abre la confirmación existente y NO anula', async () => {
      const ctx = tableCtx()
      const result = await ejecutar(tool(buildHistorialTableTools(ctx), 'abrir_anular_venta'), { venta_id: 1 })
      expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('debe presionar Confirmar anulacion') } })
      expect(ctx.openAnular).toHaveBeenCalledOnce()
    })

    it('respeta estado y permiso', async () => {
      const ctx = tableCtx()
      expect((await ejecutar(tool(buildHistorialTableTools(ctx), 'abrir_anular_venta'), { venta_id: 3 })).ok).toBe(false)
      const sinPermiso = tableCtx({ getUser: () => ({ role: 'vendedor' as const, puede_anular: false }) })
      expect((await ejecutar(tool(buildHistorialTableTools(sinPermiso), 'abrir_anular_venta'), { venta_id: 1 })).ok).toBe(false)
      expect(ctx.openAnular).not.toHaveBeenCalled()
      expect(sinPermiso.openAnular).not.toHaveBeenCalled()
    })
  })

  it.each(['ver_foto_venta', 'abrir_anular_venta'])('%s con un diálogo ya abierto falla', async (name) => {
    const ctx = tableCtx({ isDialogOpen: () => true })
    expect(await ejecutar(tool(buildHistorialTableTools(ctx), name), { venta_id: 2 })).toMatchObject({
      ok: false,
      error: 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.',
    })
  })
})

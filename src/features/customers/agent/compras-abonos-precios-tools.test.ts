import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { formatCurrency } from '@/helpers/money'
import type { Venta } from '@/features/sales/types/sales'
import type { Abono } from '../types/clientes'
import type { ClienteVariantePrecioResponse } from '../types/customer-prices'
import {
  buildAbonosTools,
  buildComprasTools,
  type AbonosAgentContext,
  type ComprasAgentContext,
} from './compras-abonos-tools'
import { buildPrecioDialogTools, buildPreciosClienteTools, type PreciosClienteAgentContext } from './precios-cliente-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}

/** Ejecuta como execute(): validar → (confirmación) → run. Devuelve también si hubo que confirmar. */
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>, confirma = true) {
  const invalid = def.validar?.(args)
  if (invalid) return { ok: false as const, error: invalid, confirmo: false }
  let confirmo = false
  if (def.requiere_confirmacion) {
    confirmo = true
    if (!confirma) return { ok: false as const, error: 'El usuario canceló la acción.', confirmo }
  }
  return { ...(await def.run(args)), confirmo }
}

const admin = { role: 'admin' as const, puede_anular: false }
const vendedorSinPermiso = { role: 'vendedor' as const, puede_anular: false }
const vendedor = { role: 'vendedor' as const, puede_anular: true }

// -- compras ------------------------------------------------------------------------------------

const venta = (id: number, estado: Venta['estado'], extra: Partial<Venta> = {}): Venta =>
  ({ id, estado, fecha: '2026-10-10', total: 100, total_neto: 100, abonado: 20, saldo: 80, ...extra }) as unknown as Venta

function comprasCtx(overrides: Partial<ComprasAgentContext> = {}) {
  return {
    getVentas: () => [venta(1, 'PENDIENTE'), venta(2, 'REVERTIDA'), venta(3, 'PAGADA', { saldo: 0, abonado: 100 })],
    getUser: () => vendedor,
    isDialogOpen: vi.fn(() => false),
    openDetalle: vi.fn(),
    openAnular: vi.fn(),
    ...overrides,
  } satisfies ComprasAgentContext
}

describe('tools de la pestaña Compras', () => {
  it('leer_compras_cliente devuelve el resumen del formato del plan', async () => {
    const result = await tool(buildComprasTools(comprasCtx()), 'leer_compras_cliente').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        total: 3,
        mostrando: 3,
        compras: [
          { id: 1, fecha: '2026-10-10', total: 100, abonado: 20, saldo: 80, estado: 'PENDIENTE' },
          { id: 2, estado: 'REVERTIDA' },
          { id: 3, abonado: 100, saldo: 0, estado: 'PAGADA' },
        ],
      },
    })
  })

  it('limita a 30 filas', async () => {
    const muchas = Array.from({ length: 80 }, (_, i) => venta(i + 1, 'PAGADA'))
    const result = await tool(buildComprasTools(comprasCtx({ getVentas: () => muchas })), 'leer_compras_cliente').run({})
    expect(result).toMatchObject({ data: { total: 80, mostrando: 30 } })
  })

  it('abrir_detalle_compra abre el detalle de una compra existente', async () => {
    const ctx = comprasCtx()
    const result = await ejecutar(tool(buildComprasTools(ctx), 'abrir_detalle_compra'), { venta_id: 2 })
    expect(result.ok).toBe(true)
    expect(ctx.openDetalle).toHaveBeenCalledWith(venta(2, 'REVERTIDA'))
  })

  it('una compra que no es del cliente no abre nada', async () => {
    const ctx = comprasCtx()
    for (const name of ['abrir_detalle_compra', 'abrir_anular_venta']) {
      expect((await ejecutar(tool(buildComprasTools(ctx), name), { venta_id: 999 })).ok, name).toBe(false)
    }
    expect(ctx.openDetalle).not.toHaveBeenCalled()
    expect(ctx.openAnular).not.toHaveBeenCalled()
  })

  describe('abrir_anular_venta', () => {
    it('abre la confirmación existente (no anula) para una venta anulable', async () => {
      const ctx = comprasCtx()
      const result = await ejecutar(tool(buildComprasTools(ctx), 'abrir_anular_venta'), { venta_id: 1 })
      expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('debe presionar Confirmar anulacion') } })
      expect(ctx.openAnular).toHaveBeenCalledWith(venta(1, 'PENDIENTE'))
    })

    it('respeta el estado: una venta revertida no se puede anular', async () => {
      const ctx = comprasCtx()
      const result = await ejecutar(tool(buildComprasTools(ctx), 'abrir_anular_venta'), { venta_id: 2 })
      expect(result).toMatchObject({ ok: false, error: expect.stringContaining('REVERTIDA') })
      expect(ctx.openAnular).not.toHaveBeenCalled()
    })

    it('respeta puede_anular: un vendedor sin permiso no puede; el admin siempre', async () => {
      const sin = comprasCtx({ getUser: () => vendedorSinPermiso })
      expect((await ejecutar(tool(buildComprasTools(sin), 'abrir_anular_venta'), { venta_id: 1 })).ok).toBe(false)
      expect(sin.openAnular).not.toHaveBeenCalled()

      const adm = comprasCtx({ getUser: () => admin })
      expect((await ejecutar(tool(buildComprasTools(adm), 'abrir_anular_venta'), { venta_id: 1 })).ok).toBe(true)
    })

    it('con un diálogo ya abierto falla', async () => {
      const ctx = comprasCtx({ isDialogOpen: () => true })
      for (const name of ['abrir_detalle_compra', 'abrir_anular_venta']) {
        expect(await ejecutar(tool(buildComprasTools(ctx), name), { venta_id: 1 })).toMatchObject({
          ok: false,
          error: 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.',
        })
      }
    })
  })
})

// -- abonos -------------------------------------------------------------------------------------

const abono = (id: number, extra: Partial<Abono> = {}): Abono =>
  ({ id, monto: 100, fecha_abono: '2026-10-11', id_venta: 1, observacion: 'pago', revertido: false, ...extra }) as unknown as Abono

function abonosCtx(overrides: Partial<AbonosAgentContext> = {}) {
  return {
    getAbonos: () => [abono(10), abono(11, { revertido: true }), abono(12, { monto: -100, id_abono_original: 10 })],
    getUser: () => vendedor,
    isDialogOpen: vi.fn(() => false),
    openAnular: vi.fn(),
    ...overrides,
  } satisfies AbonosAgentContext
}

describe('tools de la pestaña Abonos', () => {
  it('leer_abonos_cliente devuelve id, fecha, monto, venta, observación y si fue revertido', async () => {
    const result = await tool(buildAbonosTools(abonosCtx()), 'leer_abonos_cliente').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        total: 3,
        abonos: [
          { id: 10, fecha: '2026-10-11', monto: 100, id_venta: 1, observacion: 'pago', revertido: false },
          { id: 11, revertido: true },
          { id: 12, monto: -100 },
        ],
      },
    })
  })

  it('abrir_anular_abono abre la confirmación para un abono vigente', async () => {
    const ctx = abonosCtx()
    expect((await ejecutar(tool(buildAbonosTools(ctx), 'abrir_anular_abono'), { abono_id: 10 })).ok).toBe(true)
    expect(ctx.openAnular).toHaveBeenCalledWith(abono(10))
  })

  it('explica por qué no se puede anular: ya revertido, reversión o sin permiso', async () => {
    const ctx = abonosCtx()
    const def = tool(buildAbonosTools(ctx), 'abrir_anular_abono')
    expect(await ejecutar(def, { abono_id: 11 })).toMatchObject({ ok: false, error: expect.stringContaining('ya fue revertido') })
    expect(await ejecutar(def, { abono_id: 12 })).toMatchObject({ ok: false, error: expect.stringContaining('reversion') })
    expect(ctx.openAnular).not.toHaveBeenCalled()

    const sin = abonosCtx({ getUser: () => vendedorSinPermiso })
    expect((await ejecutar(tool(buildAbonosTools(sin), 'abrir_anular_abono'), { abono_id: 10 })).ok).toBe(false)
  })

  it('un abono ajeno o un diálogo abierto no abren nada', async () => {
    const ctx = abonosCtx()
    expect((await ejecutar(tool(buildAbonosTools(ctx), 'abrir_anular_abono'), { abono_id: 999 })).ok).toBe(false)
    const abierto = abonosCtx({ isDialogOpen: () => true })
    expect((await ejecutar(tool(buildAbonosTools(abierto), 'abrir_anular_abono'), { abono_id: 10 })).ok).toBe(false)
    expect(ctx.openAnular).not.toHaveBeenCalled()
    expect(abierto.openAnular).not.toHaveBeenCalled()
  })
})

// -- precios del cliente -------------------------------------------------------------------------

const variante = (id: number, extra: Partial<ClienteVariantePrecioResponse> = {}): ClienteVariantePrecioResponse => ({
  id_variante: id,
  id_articulo: 100 + id,
  articulo: `Camisa ${id}`,
  id_talla: 1,
  talla: 'M',
  sku: `SKU-${id}`,
  precio_base: 100,
  precio_cliente: 80,
  precio_efectivo: 80,
  ahorro: 20,
  tiene_config: true,
  fecha_actualizacion: '2026-10-01',
  ...extra,
})

function preciosCtx(overrides: Partial<PreciosClienteAgentContext> = {}) {
  const variants = [variante(1), variante(2, { tiene_config: false, precio_cliente: null, ahorro: 0 }), variante(3)]
  return {
    getCustomerName: () => 'María López',
    getVariants: () => variants,
    getFiltered: () => variants,
    getFilters: vi.fn(() => ({ texto: '', vista: 'todos' as const })),
    setFilters: vi.fn(),
    isDialogOpen: vi.fn(() => false),
    openEdit: vi.fn(),
    deletePrecio: vi.fn(async () => undefined),
    ...overrides,
  } satisfies PreciosClienteAgentContext
}

describe('tools de precios del cliente', () => {
  it('un vendedor solo filtra y lee; el admin además edita y elimina', () => {
    expect(buildPreciosClienteTools(preciosCtx(), false).map((t) => t.name)).toEqual([
      'filtrar_precios_cliente',
      'leer_precios_cliente',
    ])
    expect(buildPreciosClienteTools(preciosCtx(), true).map((t) => t.name)).toEqual([
      'filtrar_precios_cliente',
      'leer_precios_cliente',
      'abrir_editar_precio_cliente',
      'eliminar_precio_cliente',
    ])
  })

  describe('filtrar_precios_cliente y leer_precios_cliente', () => {
    it('aplica texto y vista', async () => {
      const ctx = preciosCtx()
      const result = await ejecutar(tool(buildPreciosClienteTools(ctx, false), 'filtrar_precios_cliente'), {
        texto: ' camisa ',
        vista: 'personalizados',
      })
      expect(ctx.setFilters).toHaveBeenCalledWith({ texto: 'camisa', vista: 'personalizados' })
      expect(result.ok).toBe(true)
    })

    it('rechaza filtros vacíos o inválidos', async () => {
      const ctx = preciosCtx()
      const def = tool(buildPreciosClienteTools(ctx, false), 'filtrar_precios_cliente')
      for (const args of [{}, { vista: 'caros' }, { texto: 5 }]) expect((await ejecutar(def, args)).ok).toBe(false)
      expect(ctx.setFilters).not.toHaveBeenCalled()
    })

    it('leer_precios_cliente separa el precio del cliente del de catálogo', async () => {
      const result = await tool(buildPreciosClienteTools(preciosCtx(), false), 'leer_precios_cliente').run({})
      expect(result).toMatchObject({
        ok: true,
        data: {
          cliente: 'María López',
          total: 3,
          personalizados: 2,
          coinciden: 3,
          precios: [
            { variante_id: 1, articulo: 'Camisa 1', precio_catalogo: 100, precio_cliente: 80, personalizado: true },
            { variante_id: 2, precio_cliente: null, personalizado: false },
            { variante_id: 3 },
          ],
        },
      })
    })
  })

  describe('abrir_editar_precio_cliente', () => {
    it('abre el diálogo con un precio inicial y no guarda', async () => {
      const ctx = preciosCtx()
      const result = await ejecutar(tool(buildPreciosClienteTools(ctx, true), 'abrir_editar_precio_cliente'), {
        variante_id: 2,
        precio: 75.5,
      })
      expect(result.ok).toBe(true)
      expect(ctx.openEdit).toHaveBeenCalledWith(variante(2, { tiene_config: false, precio_cliente: null, ahorro: 0 }), 75.5)
      expect(ctx.deletePrecio).not.toHaveBeenCalled()
    })

    it('rechaza variantes ajenas, precios inválidos y el diálogo ya abierto', async () => {
      const ctx = preciosCtx()
      const def = tool(buildPreciosClienteTools(ctx, true), 'abrir_editar_precio_cliente')
      expect((await ejecutar(def, { variante_id: 999 })).ok).toBe(false)
      expect((await ejecutar(def, { variante_id: 1, precio: -3 })).ok).toBe(false)
      expect((await ejecutar(def, { variante_id: 1, precio: 0 })).ok).toBe(false)
      expect(ctx.openEdit).not.toHaveBeenCalled()

      const abierto = preciosCtx({ isDialogOpen: () => true })
      expect(await ejecutar(tool(buildPreciosClienteTools(abierto, true), 'abrir_editar_precio_cliente'), { variante_id: 1 })).toMatchObject({
        ok: false,
        error: 'El formulario ya está abierto: usa llenar_precio_cliente para cambiar campos.',
      })
    })
  })

  describe('llenar_precio_cliente (dentro del diálogo de precio)', () => {
    const dialog = (setPrecio = vi.fn()) => buildPrecioDialogTools({ getVariant: () => variante(1), getPrecio: () => '80', setPrecio })

    it('escribe el precio en el diálogo y no guarda', async () => {
      const setPrecio = vi.fn()
      const [def] = dialog(setPrecio)
      const result = await ejecutar(def, { precio: 75.5 })
      expect(setPrecio).toHaveBeenCalledWith('75.5')
      expect(result).toMatchObject({ ok: true, data: { aplicado: { precio: 75.5 }, mensaje: expect.stringContaining('presionar el boton') } })
    })

    it('valida que el precio sea mayor a 0', async () => {
      const setPrecio = vi.fn()
      const [def] = dialog(setPrecio)
      for (const precio of [0, -1, '5', NaN, undefined]) expect((await ejecutar(def, { precio })).ok, String(precio)).toBe(false)
      expect(setPrecio).not.toHaveBeenCalled()
    })

    it('no pide confirmación (solo llena el campo)', () => {
      expect(dialog()[0].requiere_confirmacion).toBeUndefined()
    })
  })

  describe('eliminar_precio_cliente [confirmación]', () => {
    const def = (ctx = preciosCtx()) => tool(buildPreciosClienteTools(ctx, true), 'eliminar_precio_cliente')

    it('declara requiere_confirmacion con validar y textoConfirmacion', () => {
      const d = def()
      expect(d.requiere_confirmacion).toBe(true)
      expect(typeof d.validar).toBe('function')
      expect(typeof d.textoConfirmacion).toBe('function')
    })

    it('el texto sale de la variante real de la lista, no del modelo', () => {
      expect(def().textoConfirmacion?.({ variante_id: 1, texto_del_modelo: 'inventado' })).toBe(
        `Eliminar el precio personalizado de Camisa 1 talla M para María López (volvera al de catalogo: ${formatCurrency(100)})`,
      )
    })

    it('con confirmación elimina el precio', async () => {
      const ctx = preciosCtx()
      const result = await ejecutar(def(ctx), { variante_id: 1 })
      expect(result.confirmo).toBe(true)
      expect(result.ok).toBe(true)
      expect(ctx.deletePrecio).toHaveBeenCalledWith(variante(1))
    })

    it('si el usuario cancela no se elimina nada', async () => {
      const ctx = preciosCtx()
      const result = await ejecutar(def(ctx), { variante_id: 1 }, false)
      expect(result.ok).toBe(false)
      expect(ctx.deletePrecio).not.toHaveBeenCalled()
    })

    it('valida ANTES de pedir confirmación: variante ajena, sin precio personalizado o argumentos malos', async () => {
      const ctx = preciosCtx()
      for (const args of [{ variante_id: 999 }, { variante_id: 2 /* sin config */ }, { variante_id: 'x' }, {}]) {
        const result = await ejecutar(def(ctx), args)
        expect(result.ok, JSON.stringify(args)).toBe(false)
        expect(result.confirmo, JSON.stringify(args)).toBe(false)
      }
      expect(ctx.deletePrecio).not.toHaveBeenCalled()
    })

    it('si el borrado falla devuelve un error claro (el hook ya muestra el toast)', async () => {
      const ctx = preciosCtx({ deletePrecio: vi.fn(async () => { throw new Error('500') }) })
      expect(await ejecutar(def(ctx), { variante_id: 1 })).toMatchObject({ ok: false, error: 'No se pudo eliminar el precio.' })
    })

    it('no se ofrece a quien no es admin', () => {
      expect(buildPreciosClienteTools(preciosCtx(), false).some((t) => t.name === 'eliminar_precio_cliente')).toBe(false)
    })
  })
})

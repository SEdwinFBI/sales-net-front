import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { BranchAvailability, CartItem } from '../types/sales'
import {
  buildClienteRapidoDialogTools,
  buildClienteRapidoOpenTools,
  buildDisponibilidadOpenTools,
  buildDisponibilidadReadTools,
  buildPreciosClientePosTools,
  buildPreciosVentaTools,
  sanitizeClienteRapido,
  type PreciosVentaContext,
} from './pos-dialog-tools'

const ejecutar = async (def: AgentToolDef, args: Record<string, unknown> = {}) => {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}
const errorOf = (result: Awaited<ReturnType<typeof ejecutar>>) => ('error' in result ? result.error : '')

describe('existencias en otras sucursales', () => {
  it('abre el diálogo de un artículo y falla si ya hay un diálogo abierto', async () => {
    const open = vi.fn()
    const [def] = buildDisponibilidadOpenTools({ isOpen: () => false, isBusy: () => false, open })
    expect(def.abreUi).toBe(true)
    expect((await ejecutar(def, { articulo_id: 9 })).ok).toBe(true)
    expect(open).toHaveBeenCalledWith(9)
    expect((await ejecutar(def, { articulo_id: 0 })).ok).toBe(false)
    for (const over of [{ isOpen: () => true, isBusy: () => false }, { isOpen: () => false, isBusy: () => true }]) {
      const [busy] = buildDisponibilidadOpenTools({ ...over, open })
      expect(errorOf(await ejecutar(busy, { articulo_id: 9 }))).toMatch(/abiert/i)
    }
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('lee la matriz por sucursal solo con las tallas que tienen existencia', async () => {
    const availability: BranchAvailability = {
      articulo: { id: 1, nombre: 'Camisa', imagen: null },
      tallas: [
        { id_variante: 11, id_talla: 1, talla: 'M', precio: 100 },
        { id_variante: 12, id_talla: 2, talla: 'L', precio: 110 },
      ],
      sucursales: [
        { id_sucursal: 1, nombre: 'Centro', es_propia: true, existencias: { '11': 4 }, total: 4 },
        { id_sucursal: 2, nombre: 'Norte', es_propia: false, existencias: { '11': 1, '12': 3 }, total: 4 },
      ],
    }
    const [def] = buildDisponibilidadReadTools({ getAvailability: () => availability, isLoading: () => false, isError: () => false })
    const result = await def.run({})
    expect(result.ok && result.data).toMatchObject({
      articulo: 'Camisa',
      sucursales: [
        { sucursal: 'Centro', es_la_mia: true, total: 4, por_talla: { M: 4 } },
        { sucursal: 'Norte', es_la_mia: false, total: 4, por_talla: { M: 1, L: 3 } },
      ],
    })
  })

  it('mientras carga o si falló, lo dice', async () => {
    const [loading] = buildDisponibilidadReadTools({ getAvailability: () => undefined, isLoading: () => true, isError: () => false })
    expect(errorOf(await loading.run({}))).toMatch(/cargando/)
    const [failed] = buildDisponibilidadReadTools({ getAvailability: () => undefined, isLoading: () => false, isError: () => true })
    expect(errorOf(await failed.run({}))).toMatch(/No se pudieron/)
  })
})

describe('cliente rápido', () => {
  it('valida como el formulario: nombre de 3+ caracteres y teléfono de 8+ dígitos', () => {
    expect(sanitizeClienteRapido({ nombre_completo: 'Al', telefono: '1234' }).errores).toHaveLength(2)
    const good = sanitizeClienteRapido({ nombre_completo: ' Ana Lopez ', telefono: 55512345, direccion: 'Zona 1', permitir_credito: false })
    expect(good.errores).toEqual([])
    expect(good.values).toEqual({ nombre_completo: 'Ana Lopez', telefono: '55512345', direccion: 'Zona 1', permitir_credito: false })
  })

  it('descarta credenciales y campos que no existen', () => {
    const result = sanitizeClienteRapido({ nombre_completo: 'Ana Lopez', clave: 'Secreto123!', balance: 500 })
    expect(result.credenciales).toEqual(['clave'])
    expect(result.ignorados).toEqual(['balance'])
    expect(JSON.stringify(result)).not.toContain('Secreto123!')
  })

  it('abrir respeta el bloqueo y llenar no guarda', async () => {
    const open = vi.fn()
    const [abrir] = buildClienteRapidoOpenTools({ bloqueo: () => null, open })
    expect((await ejecutar(abrir)).ok).toBe(true)
    expect(open).toHaveBeenCalled()
    const [bloqueada] = buildClienteRapidoOpenTools({ bloqueo: () => 'La venta se esta procesando.', open })
    expect((await ejecutar(bloqueada)).ok).toBe(false)

    const setValues = vi.fn()
    const [llenar] = buildClienteRapidoDialogTools({
      getValues: () => ({ nombre_completo: '', telefono: '', direccion: 'Ciudad', permitir_credito: true }),
      setValues,
    })
    expect(llenar.requiere_confirmacion).toBeUndefined()
    expect((await llenar.run({ telefono: '12' })).ok).toBe(false)
    expect(setValues).not.toHaveBeenCalled()
    expect((await llenar.run({ nombre_completo: 'Ana Lopez', telefono: '55512345' })).ok).toBe(true)
    expect(setValues).toHaveBeenCalledWith({ nombre_completo: 'Ana Lopez', telefono: '55512345' })
  })
})

describe('precios del cliente desde el punto de venta', () => {
  it('exige un cliente seleccionado y que no haya otro diálogo abierto', async () => {
    const open = vi.fn()
    const [sinCliente] = buildPreciosClientePosTools({ getCustomerId: () => 0, isBusy: () => false, open })
    expect(errorOf(await ejecutar(sinCliente))).toMatch(/seleccionar un cliente/)
    const [ocupado] = buildPreciosClientePosTools({ getCustomerId: () => 4, isBusy: () => true, open })
    expect(errorOf(await ejecutar(ocupado))).toMatch(/abiert/i)
    const [okTool] = buildPreciosClientePosTools({ getCustomerId: () => 4, isBusy: () => false, open })
    expect((await ejecutar(okTool)).ok).toBe(true)
    expect(open).toHaveBeenCalledTimes(1)
  })
})

describe('guardar precios de la venta', () => {
  const item = (id: string, variantId: number, extra: Partial<CartItem> = {}) =>
    ({ id, variantId, productId: 1, name: `Articulo ${variantId}`, size: 'M', price: 100, basePrice: 120, discount: 10, qty: 1, ...extra }) as CartItem

  const context = (over: Partial<PreciosVentaContext> = {}) => {
    const ctx = {
      getItems: () => [item('a', 11), item('b', 12, { discount: 0 })],
      getSelectedIds: () => new Set(['a']),
      setSelectedIds: vi.fn(),
      getCustomerId: () => '4',
      getCustomers: () => [{ id: 4, name: 'Ana' }, { id: 5, name: 'Luis' }],
      setCustomerId: vi.fn(),
      hasSaved: () => false,
      ...over,
    } satisfies PreciosVentaContext
    return ctx
  }
  const tool = (ctx: PreciosVentaContext, name: string) => buildPreciosVentaTools(ctx).find((t) => t.name === name)!

  it('lee el precio que se guardaría (precio menos descuento) y qué está marcado', async () => {
    const result = await tool(context(), 'leer_precios_venta').run({})
    expect(result.ok && result.data).toMatchObject({
      cliente: 'Ana',
      cliente_id: 4,
      articulos: [
        { variante_id: 11, precio_catalogo: 120, precio_a_guardar: 90, marcado: true },
        { variante_id: 12, precio_a_guardar: 100, marcado: false },
      ],
    })
  })

  it('elige artículos y cliente solo entre los de la venta y los cargados; no guarda', async () => {
    const ctx = context()
    const def = tool(ctx, 'elegir_precios_venta')
    expect(def.requiere_confirmacion).toBeUndefined()
    expect((await ejecutar(def, { variante_ids: [12], cliente_id: 5 })).ok).toBe(true)
    expect(ctx.setSelectedIds).toHaveBeenCalledWith(new Set(['b']))
    expect(ctx.setCustomerId).toHaveBeenCalledWith('5')
    expect(errorOf(await ejecutar(def, { variante_ids: [99] }))).toMatch(/no son de la venta/)
    expect(errorOf(await ejecutar(def, { cliente_id: 77 }))).toMatch(/clientes cargados/)
    expect((await ejecutar(def, {})).ok).toBe(false)
  })

  it('una vez guardados ya no se puede cambiar la selección', async () => {
    const ctx = context({ hasSaved: () => true })
    expect(errorOf(await ejecutar(tool(ctx, 'elegir_precios_venta'), { variante_ids: [11] }))).toMatch(/ya se guardaron/)
    expect(ctx.setSelectedIds).not.toHaveBeenCalled()
  })
})

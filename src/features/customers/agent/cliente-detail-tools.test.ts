import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Venta } from '@/features/sales/types/sales'
import type { Cliente } from '../types/clientes'
import {
  availableTabs,
  buildAbonoDialogTools,
  buildAjusteDialogTools,
  buildClienteDetailTools,
  buildVentaClienteDialogTools,
  type ClienteDetailAgentContext,
} from './cliente-detail-tools'

const cliente = (extra: Partial<Cliente> = {}): Cliente => ({
  id: 7,
  permitir_credito: true,
  nombre_completo: 'María López',
  direccion: 'Zona 1',
  telefono: '55551234',
  balance: 380,
  fecha_creacion: '2026-01-01',
  activo: true,
  ...extra,
})

const venta = (id: number, saldo: number): Venta =>
  ({ id, saldo, abonado: 0, total: saldo, total_neto: saldo, estado: 'PENDIENTE' }) as unknown as Venta

function context(overrides: Partial<ClienteDetailAgentContext> = {}, c = cliente()) {
  return {
    getCliente: () => c,
    getTab: vi.fn(() => 'movimientos' as const),
    setTab: vi.fn(),
    getResumen: () => ({ total_ventas: 3, total_general: 900, total_pagado: 520, total_abonado: 520, balance: 380 }),
    getVentas: () => [venta(45, 300), venta(46, 0)],
    isDialogOpen: vi.fn(() => false),
    openAbono: vi.fn(),
    openAjuste: vi.fn(),
    openVenta: vi.fn(),
    ...overrides,
  } satisfies ClienteDetailAgentContext
}

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
/** Ejecuta como lo hace execute(): primero validar y, si pasa, run. */
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  if (invalid) return { ok: false as const, error: invalid }
  return def.run(args)
}

describe('pestañas disponibles', () => {
  it('un cliente sin crédito solo tiene compras y precios (igual que la UI)', () => {
    expect(availableTabs(cliente({ permitir_credito: false }))).toEqual(['compras', 'precios'])
    expect(availableTabs(cliente())).toEqual(['movimientos', 'abonos', 'compras', 'precios'])
  })
})

describe('tools de la ficha del cliente', () => {
  it('con crédito: pestañas, lectura y los 3 formularios', () => {
    expect(buildClienteDetailTools(context()).map((t) => t.name)).toEqual([
      'cambiar_pestana_cliente',
      'leer_cliente',
      'abrir_registrar_abono',
      'abrir_registrar_ajuste',
      'abrir_registrar_venta_cliente',
    ])
  })

  it('sin crédito: no existen las tools de abono, ajuste ni venta', () => {
    const tools = buildClienteDetailTools(context({}, cliente({ permitir_credito: false })))
    expect(tools.map((t) => t.name)).toEqual(['cambiar_pestana_cliente', 'leer_cliente'])
  })

  describe('cambiar_pestana_cliente', () => {
    it('cambia a una pestaña disponible', async () => {
      const ctx = context()
      const result = await ejecutar(tool(buildClienteDetailTools(ctx), 'cambiar_pestana_cliente'), { pestana: 'abonos' })
      expect(result.ok).toBe(true)
      expect(ctx.setTab).toHaveBeenCalledWith('abonos')
    })

    it('rechaza una pestaña que el cliente no tiene o inexistente', async () => {
      const sinCredito = context({}, cliente({ permitir_credito: false }))
      const def = tool(buildClienteDetailTools(sinCredito), 'cambiar_pestana_cliente')
      for (const pestana of ['abonos', 'movimientos', 'otra', 5, undefined]) {
        expect((await ejecutar(def, { pestana })).ok, String(pestana)).toBe(false)
      }
      expect(sinCredito.setTab).not.toHaveBeenCalled()
    })

    it('abreUi: espera a que la pestaña nueva registre sus tools', () => {
      expect(tool(buildClienteDetailTools(context()), 'cambiar_pestana_cliente').abreUi).toBe(true)
    })
  })

  it('leer_cliente devuelve la ficha, el resumen y la pestaña activa', async () => {
    const result = await tool(buildClienteDetailTools(context()), 'leer_cliente').run({})
    expect(result).toEqual({
      ok: true,
      data: {
        id: 7,
        nombre: 'María López',
        telefono: '55551234',
        direccion: 'Zona 1',
        credito: true,
        balance: 380,
        activo: true,
        pestana_activa: 'movimientos',
        pestanas: ['movimientos', 'abonos', 'compras', 'precios'],
        resumen: { total_ventas: 3, total_general: 900, total_pagado: 520, total_abonado: 520, balance: 380 },
      },
    })
  })

  describe('abrir_registrar_abono', () => {
    it('abre el formulario precargado con una venta con saldo, sin registrar nada', async () => {
      const ctx = context()
      const result = await ejecutar(tool(buildClienteDetailTools(ctx), 'abrir_registrar_abono'), {
        valores: { id_venta: 45, monto: 100 },
      })
      expect(result).toMatchObject({ ok: true, data: { precargado: { idVenta: 45, monto: 100 } } })
      expect(ctx.openAbono).toHaveBeenCalledWith({ idVenta: 45, monto: 100 })
    })

    it('una venta sin saldo o ajena se rechaza antes de abrir nada', async () => {
      const ctx = context()
      const def = tool(buildClienteDetailTools(ctx), 'abrir_registrar_abono')
      expect((await ejecutar(def, { valores: { id_venta: 46 } })).ok).toBe(false)
      expect((await ejecutar(def, { valores: { id_venta: 999 } })).ok).toBe(false)
      expect(ctx.openAbono).not.toHaveBeenCalled()
    })

    it('sin valores abre el formulario vacío', async () => {
      const ctx = context()
      await ejecutar(tool(buildClienteDetailTools(ctx), 'abrir_registrar_abono'), {})
      expect(ctx.openAbono).toHaveBeenCalledWith(undefined)
    })
  })

  it('abrir_registrar_ajuste precarga monto, signo y descripción', async () => {
    const ctx = context()
    await ejecutar(tool(buildClienteDetailTools(ctx), 'abrir_registrar_ajuste'), {
      valores: { monto: 20, negativo: true, descripcion: 'devolución' },
    })
    expect(ctx.openAjuste).toHaveBeenCalledWith({ monto: 20, negativo: true, descripcion: 'devolución' })
  })

  it('abrir_registrar_venta_cliente precarga la venta', async () => {
    const ctx = context()
    await ejecutar(tool(buildClienteDetailTools(ctx), 'abrir_registrar_venta_cliente'), {
      valores: { forma_pago: 'credito', monto: 75 },
    })
    expect(ctx.openVenta).toHaveBeenCalledWith({ forma_pago: 'credito', monto: 75 })
  })

  describe('con un diálogo ya abierto', () => {
    it.each(['abrir_registrar_abono', 'abrir_registrar_ajuste', 'abrir_registrar_venta_cliente'])(
      '%s falla en vez de responder "precargado"',
      async (name) => {
        const ctx = context({ isDialogOpen: () => true })
        const result = await ejecutar(tool(buildClienteDetailTools(ctx), name), { valores: {} })
        expect(result).toEqual({
          ok: false,
          error: 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.',
        })
        expect(ctx.openAbono).not.toHaveBeenCalled()
        expect(ctx.openAjuste).not.toHaveBeenCalled()
        expect(ctx.openVenta).not.toHaveBeenCalled()
      },
    )
  })

  it('ninguna tool de la ficha guarda: no piden confirmación porque abren el formulario existente', () => {
    for (const def of buildClienteDetailTools(context())) {
      expect(def.requiere_confirmacion).toBeUndefined()
      expect(def.name).not.toMatch(/^(registrar|guardar|crear|enviar)_/)
    }
  })
})

describe('tools de los diálogos abiertos', () => {
  it('llenar_formulario_abono escribe en el formulario y no registra', async () => {
    const setValues = vi.fn()
    const [def] = buildAbonoDialogTools({
      getVentas: () => [venta(45, 300)],
      getValues: () => ({ idVenta: 45, monto: 50, observacion: '' }),
      setValues,
    })
    const result = await def.run({ monto: 50, id_venta: 45 })
    expect(setValues).toHaveBeenCalledWith({ monto: 50, idVenta: 45 })
    expect(result).toMatchObject({ ok: true, data: { aplicado: { monto: 50, idVenta: 45 } } })
  })

  it('llenar_formulario_abono rechaza una venta que no se puede abonar', async () => {
    const setValues = vi.fn()
    const [def] = buildAbonoDialogTools({
      getVentas: () => [venta(45, 0)],
      getValues: () => ({ idVenta: 0, monto: 0, observacion: '' }),
      setValues,
    })
    expect((await def.run({ id_venta: 45 })).ok).toBe(false)
    expect(setValues).not.toHaveBeenCalled()
  })

  it('llenar_formulario_ajuste aplica el signo', async () => {
    const setValues = vi.fn()
    const [def] = buildAjusteDialogTools({
      getValues: () => ({ monto: 10, negativo: true, descripcion: 'x' }),
      setValues,
    })
    await def.run({ monto: 10, negativo: true })
    expect(setValues).toHaveBeenCalledWith({ monto: 10, negativo: true })
  })

  it('llenar_formulario_venta_cliente valida la sucursal contra las cargadas', async () => {
    const setValues = vi.fn()
    const [def] = buildVentaClienteDialogTools({
      getSucursalIds: () => [1, 2],
      getValues: () => ({}),
      setValues,
    })
    expect((await def.run({ sucursal_id: 9 })).ok).toBe(false)
    expect((await def.run({ sucursal_id: 2, forma_pago: 'efectivo' })).ok).toBe(true)
    expect(setValues).toHaveBeenCalledTimes(1)
    expect(setValues).toHaveBeenCalledWith({ sucursal_id: 2, forma_pago: 'efectivo' })
  })

  it('sin ningún campo válido fallan y explican por qué', async () => {
    const [def] = buildAjusteDialogTools({ getValues: () => ({ monto: 0, negativo: false, descripcion: '' }), setValues: vi.fn() })
    expect(await def.run({ password: 'x' })).toEqual({ ok: false, error: 'No hay ningun campo valido para llenar.' })
    expect((await def.run({ monto: -5 })).ok).toBe(false)
  })
})

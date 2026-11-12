import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Caja } from '../types/cash'
import { buildArqueosTools, type ArqueosAgentContext } from './arqueos-tools'
import {
  buildMiCajaTools,
  buildMovimientoDialogTools,
  sanitizeMovimientoValues,
  type MiCajaAgentContext,
} from './mi-caja-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}

const caja = (id: number, extra: Partial<Caja> = {}): Caja => ({
  id,
  fecha: '2026-10-14',
  usuario: { id: 5, nombre: 'Ana Pérez', username: 'ana' },
  sucursal: { id: 1, nombre: 'Centro' },
  entradas: '200',
  salidas: '50',
  ventas_efectivo: '300',
  efectivo_esperado: '450',
  cantidad_movimientos: 2,
  movimientos: [
    { id: 1, tipo: 'ENTRADA', tipo_display: 'Entrada', monto: '200', observacion: 'inicial', fecha: '2026-10-14T08:00', usuario: { id: 5, nombre: 'Ana' } },
    { id: 2, tipo: 'SALIDA', tipo_display: 'Salida', monto: '50', observacion: 'almuerzo', fecha: '2026-10-14T13:00', usuario: { id: 5, nombre: 'Ana' } },
  ],
  ...extra,
})

// -- mi caja ----------------------------------------------------------------------------------------

describe('sanitizeMovimientoValues', () => {
  it('acepta tipo, monto y observación', () => {
    expect(sanitizeMovimientoValues({ tipo: 'salida', monto: 25, observacion: ' almuerzo ' })).toEqual({
      values: { tipo: 'SALIDA', monto: 25, observacion: 'almuerzo' },
      ignorados: [],
      errores: [],
    })
  })

  it('rechaza tipos, montos y observaciones inválidos', () => {
    const r = sanitizeMovimientoValues({ tipo: 'GASTO', monto: -5, observacion: '  ' })
    expect(r.values).toEqual({})
    expect(r.errores).toHaveLength(3)
    for (const monto of [0, '25', NaN, 5_000_000]) expect(sanitizeMovimientoValues({ monto }).errores, String(monto)).toHaveLength(1)
  })

  it('reporta campos ajenos y valores que no son objeto', () => {
    expect(sanitizeMovimientoValues({ monto: 5, usuario: 3 }).ignorados).toEqual(['usuario'])
    expect(sanitizeMovimientoValues('x').errores).toHaveLength(1)
    expect(sanitizeMovimientoValues(undefined)).toEqual({ values: {}, ignorados: [], errores: [] })
  })
})

function miCajaCtx(overrides: Partial<MiCajaAgentContext> = {}) {
  return {
    getCaja: () => caja(9),
    isLoading: () => false,
    isDialogOpen: vi.fn(() => false),
    openMovimiento: vi.fn(),
    ...overrides,
  } satisfies MiCajaAgentContext
}

describe('tools de /caja/mi-caja', () => {
  it('leer_mi_caja resume la caja de hoy', async () => {
    const result = await tool(buildMiCajaTools(miCajaCtx()), 'leer_mi_caja').run({})
    expect(result).toMatchObject({
      ok: true,
      data: {
        sucursal: 'Centro',
        entradas: 200,
        gastos: 50,
        ventas_efectivo: 300,
        saldo_esperado: 450,
        total_movimientos: 2,
        movimientos: [{ tipo: 'ENTRADA', monto: 200, observacion: 'inicial' }, { tipo: 'SALIDA', monto: 50 }],
      },
    })
  })

  it('leer_mi_caja avisa si aún carga o no hay caja', async () => {
    const cargando = miCajaCtx({ getCaja: () => undefined, isLoading: () => true })
    expect(await tool(buildMiCajaTools(cargando), 'leer_mi_caja').run({})).toMatchObject({ ok: false, error: expect.stringContaining('cargando') })
    const sin = miCajaCtx({ getCaja: () => undefined })
    expect((await tool(buildMiCajaTools(sin), 'leer_mi_caja').run({})).ok).toBe(false)
  })

  describe('abrir_movimiento_caja', () => {
    it('abre el formulario precargado ("un gasto de 25 por almuerzo") sin guardar', async () => {
      const ctx = miCajaCtx()
      const result = await ejecutar(tool(buildMiCajaTools(ctx), 'abrir_movimiento_caja'), {
        valores: { tipo: 'SALIDA', monto: 25, observacion: 'almuerzo' },
      })
      expect(result).toMatchObject({ ok: true, data: { mensaje: expect.stringContaining('presionar Guardar') } })
      expect(ctx.openMovimiento).toHaveBeenCalledWith({ tipo: 'SALIDA', monto: 25, observacion: 'almuerzo' })
    })

    it('sin valores abre el formulario vacío', async () => {
      const ctx = miCajaCtx()
      await ejecutar(tool(buildMiCajaTools(ctx), 'abrir_movimiento_caja'), {})
      expect(ctx.openMovimiento).toHaveBeenCalledWith(undefined)
    })

    it('rechaza valores inválidos y la caja cargando', async () => {
      const ctx = miCajaCtx()
      expect((await ejecutar(tool(buildMiCajaTools(ctx), 'abrir_movimiento_caja'), { valores: { monto: -3 } })).ok).toBe(false)
      const cargando = miCajaCtx({ isLoading: () => true })
      expect((await ejecutar(tool(buildMiCajaTools(cargando), 'abrir_movimiento_caja'), {})).ok).toBe(false)
      expect(ctx.openMovimiento).not.toHaveBeenCalled()
      expect(cargando.openMovimiento).not.toHaveBeenCalled()
    })

    it('con el formulario ya abierto apunta a llenar_formulario_movimiento_caja', async () => {
      const ctx = miCajaCtx({ isDialogOpen: () => true })
      expect(await ejecutar(tool(buildMiCajaTools(ctx), 'abrir_movimiento_caja'), { valores: { monto: 5 } })).toEqual({
        ok: false,
        error: 'El formulario ya está abierto: usa llenar_formulario_movimiento_caja para cambiar campos.',
      })
      expect(ctx.openMovimiento).not.toHaveBeenCalled()
    })
  })

  describe('llenar_formulario_movimiento_caja', () => {
    it('escribe en el formulario abierto y no guarda', async () => {
      const setValues = vi.fn()
      const [def] = buildMovimientoDialogTools({
        getValues: () => ({ tipo: 'SALIDA', monto: 30, observacion: 'pasaje' }),
        setValues,
      })
      const result = await def.run({ monto: 30, observacion: 'pasaje' })
      expect(setValues).toHaveBeenCalledWith({ monto: 30, observacion: 'pasaje' })
      expect(result).toMatchObject({ ok: true, data: { valores_actuales: { monto: 30 } } })
    })

    it('sin campos válidos falla', async () => {
      const setValues = vi.fn()
      const [def] = buildMovimientoDialogTools({ getValues: () => ({ tipo: 'ENTRADA', monto: 0, observacion: '' }), setValues })
      expect((await def.run({ monto: 0 })).ok).toBe(false)
      expect(await def.run({ usuario: 1 })).toEqual({ ok: false, error: 'No hay ningun campo valido para llenar.' })
      expect(setValues).not.toHaveBeenCalled()
    })
  })
})

// -- arqueos ----------------------------------------------------------------------------------------

function arqueosCtx(overrides: Partial<ArqueosAgentContext> = {}) {
  const hoy = [
    caja(1, { sucursal: { id: 1, nombre: 'Centro' }, usuario: { id: 5, nombre: 'Ana', username: 'ana' } }),
    caja(2, { sucursal: { id: 2, nombre: 'Norte' }, usuario: { id: 6, nombre: 'Luis', username: 'luis' }, efectivo_esperado: '100' }),
  ]
  return {
    getFilters: () => ({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-14' }),
    setFilters: vi.fn(),
    getLevel: vi.fn(() => 'general' as const),
    isLoading: () => false,
    getSucursales: () => [
      { id: 1, nombre: 'Centro', activo: true, usuarios_count: 2 },
      { id: 2, nombre: 'Norte', activo: true, usuarios_count: 1 },
    ],
    getBranch: () => undefined,
    getUser: () => undefined,
    getTodayCajas: () => hoy,
    getPeriodCajas: () => [],
    isDialogOpen: vi.fn(() => false),
    selectBranch: vi.fn(),
    selectUser: vi.fn(),
    back: vi.fn(),
    openDetalle: vi.fn(),
    isDownloading: () => false,
    download: vi.fn(async () => true),
    ...overrides,
  } satisfies ArqueosAgentContext
}

const branchCtx = (overrides: Partial<ArqueosAgentContext> = {}) =>
  arqueosCtx({
    getLevel: () => 'sucursal',
    getBranch: () => ({
      id: 1,
      nombre: 'Centro',
      usuarios: [
        { id: 5, username: 'ana', full_name: 'Ana Pérez' },
        { id: 7, username: 'sin', full_name: '' },
      ],
    }),
    getTodayCajas: () => [caja(1)],
    ...overrides,
  })

const userCtx = (overrides: Partial<ArqueosAgentContext> = {}) =>
  branchCtx({
    getLevel: () => 'usuario',
    getUser: () => ({ id: 5, username: 'ana', full_name: 'Ana Pérez' }),
    getPeriodCajas: () => [caja(10, { fecha: '2026-10-13' }), caja(11)],
    ...overrides,
  })

describe('tools de /caja/arqueos', () => {
  describe('filtrar_arqueos', () => {
    it('cambia el rango de fechas (combinando con el actual)', async () => {
      const ctx = arqueosCtx()
      const result = await ejecutar(tool(buildArqueosTools(ctx), 'filtrar_arqueos'), { fecha_desde: '2026-10-05' })
      expect(result.ok).toBe(true)
      expect(ctx.setFilters).toHaveBeenCalledWith({ fecha_desde: '2026-10-05', fecha_hasta: '2026-10-14' })
    })

    it('las fechas nunca quedan vacías ni invertidas', async () => {
      const ctx = arqueosCtx()
      const def = tool(buildArqueosTools(ctx), 'filtrar_arqueos')
      for (const args of [{}, { fecha_desde: '' }, { fecha_hasta: '2026-13-01' }, { fecha_desde: '2026-12-01' }]) {
        expect((await ejecutar(def, args)).ok, JSON.stringify(args)).toBe(false)
      }
      expect(ctx.setFilters).not.toHaveBeenCalled()
    })
  })

  describe('leer_arqueos según el nivel', () => {
    it('general: sucursales con su saldo esperado de hoy', async () => {
      const result = await tool(buildArqueosTools(arqueosCtx()), 'leer_arqueos').run({})
      expect(result).toMatchObject({
        ok: true,
        data: {
          nivel: 'general',
          sucursales: [
            { id: 1, nombre: 'Centro', usuarios: 2, saldo_esperado_hoy: 450 },
            { id: 2, nombre: 'Norte', usuarios: 1, saldo_esperado_hoy: 100 },
          ],
        },
      })
    })

    it('sucursal: totales de hoy y usuarios (el nombre cae al username si no tiene)', async () => {
      const result = await tool(buildArqueosTools(branchCtx()), 'leer_arqueos').run({})
      expect(result).toMatchObject({
        ok: true,
        data: {
          nivel: 'sucursal',
          sucursal: 'Centro',
          hoy: { entradas: 200, gastos: 50, resto: 150, ventas_efectivo: 300, saldo_esperado: 450 },
          usuarios: [
            { id: 5, nombre: 'Ana Pérez', tiene_caja_hoy: true, saldo_esperado_hoy: 450 },
            { id: 7, nombre: 'sin', tiene_caja_hoy: false, saldo_esperado_hoy: 0 },
          ],
        },
      })
    })

    it('usuario: cajas por día con caja_id', async () => {
      const result = await tool(buildArqueosTools(userCtx()), 'leer_arqueos').run({})
      expect(result).toMatchObject({
        ok: true,
        data: {
          nivel: 'usuario',
          usuario: 'Ana Pérez',
          total_cajas: 2,
          cajas: [{ caja_id: 10, fecha: '2026-10-13', resto: 150, saldo_esperado: 450 }, { caja_id: 11 }],
        },
      })
    })
  })

  describe('navegación general → sucursal → usuario', () => {
    it('abrir_arqueo_sucursal con una sucursal de la lista', async () => {
      const ctx = arqueosCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'abrir_arqueo_sucursal'), { sucursal_id: 2 })).ok).toBe(true)
      expect(ctx.selectBranch).toHaveBeenCalledWith(2)
    })

    it('una sucursal inexistente no navega', async () => {
      const ctx = arqueosCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'abrir_arqueo_sucursal'), { sucursal_id: 99 })).ok).toBe(false)
      expect(ctx.selectBranch).not.toHaveBeenCalled()
    })

    it('abrir_arqueo_usuario exige sucursal seleccionada y un usuario suyo', async () => {
      const sinSucursal = arqueosCtx()
      expect(await ejecutar(tool(buildArqueosTools(sinSucursal), 'abrir_arqueo_usuario'), { usuario_id: 5 })).toMatchObject({
        ok: false,
        error: expect.stringContaining('abrir_arqueo_sucursal'),
      })

      const ctx = branchCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'abrir_arqueo_usuario'), { usuario_id: 5 })).ok).toBe(true)
      expect(ctx.selectUser).toHaveBeenCalledWith(5)
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'abrir_arqueo_usuario'), { usuario_id: 99 })).ok).toBe(false)
      expect(ctx.selectUser).toHaveBeenCalledTimes(1)
    })

    it('volver_arqueos retrocede un nivel, salvo en la lista de sucursales', async () => {
      const ctx = branchCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'volver_arqueos'), {})).ok).toBe(true)
      expect(ctx.back).toHaveBeenCalledOnce()
      const general = arqueosCtx()
      expect((await ejecutar(tool(buildArqueosTools(general), 'volver_arqueos'), {})).ok).toBe(false)
      expect(general.back).not.toHaveBeenCalled()
    })
  })

  describe('ver_detalle_caja', () => {
    it('abre el detalle de una caja del usuario seleccionado', async () => {
      const ctx = userCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'ver_detalle_caja'), { caja_id: 10 })).ok).toBe(true)
      expect(ctx.openDetalle).toHaveBeenCalledWith(10)
    })

    it('exige el nivel usuario y una caja de la lista', async () => {
      const enSucursal = branchCtx()
      expect((await ejecutar(tool(buildArqueosTools(enSucursal), 'ver_detalle_caja'), { caja_id: 10 })).ok).toBe(false)
      const ctx = userCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'ver_detalle_caja'), { caja_id: 999 })).ok).toBe(false)
      expect(enSucursal.openDetalle).not.toHaveBeenCalled()
      expect(ctx.openDetalle).not.toHaveBeenCalled()
    })
  })

  it.each([
    ['abrir_arqueo_sucursal', { sucursal_id: 1 }],
    ['abrir_arqueo_usuario', { usuario_id: 5 }],
    ['ver_detalle_caja', { caja_id: 10 }],
  ])('%s con el detalle de caja ya abierto falla', async (name, args) => {
    const ctx = userCtx({ isDialogOpen: () => true })
    expect(await ejecutar(tool(buildArqueosTools(ctx), name), args)).toMatchObject({
      ok: false,
      error: 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.',
    })
  })

  describe('descargar_reporte_caja', () => {
    it('descarga el reporte', async () => {
      const ctx = arqueosCtx()
      expect((await ejecutar(tool(buildArqueosTools(ctx), 'descargar_reporte_caja'), {})).ok).toBe(true)
      expect(ctx.download).toHaveBeenCalledOnce()
    })

    it('no descarga dos veces a la vez, y reporta un fallo', async () => {
      const ocupado = arqueosCtx({ isDownloading: () => true })
      expect((await ejecutar(tool(buildArqueosTools(ocupado), 'descargar_reporte_caja'), {})).ok).toBe(false)
      expect(ocupado.download).not.toHaveBeenCalled()
      const falla = arqueosCtx({ download: vi.fn(async () => false) })
      expect(await ejecutar(tool(buildArqueosTools(falla), 'descargar_reporte_caja'), {})).toMatchObject({
        ok: false,
        error: 'No se pudo descargar el reporte.',
      })
    })
  })
})

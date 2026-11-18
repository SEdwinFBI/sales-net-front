import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { Sucursal } from '../branches/types/sucursal-types'
import {
  buildEquipoTools,
  buildSucursalDialogTools,
  buildSucursalesTools,
  sanitizeSucursalValues,
  type EquipoAgentContext,
  type SucursalesAgentContext,
} from './sucursales-tools'

const tool = (tools: AgentToolDef[], name: string) => {
  const found = tools.find((t) => t.name === name)
  if (!found) throw new Error(`falta ${name}`)
  return found
}
async function ejecutar(def: AgentToolDef, args: Record<string, unknown>) {
  const invalid = def.validar?.(args)
  return invalid ? { ok: false as const, error: invalid } : def.run(args)
}
const errorOf = (result: Awaited<ReturnType<typeof ejecutar>>) => ('error' in result ? result.error : '')

const sucursal = (id: number, extra: Partial<Sucursal> = {}): Sucursal => ({
  id,
  nombre: `Sucursal ${id}`,
  direccion: `Calle ${id}`,
  telefono: '55512345',
  activo: true,
  fecha_creacion: '2026-01-01',
  usuarios_count: id,
  ...extra,
})

describe('sanitizeSucursalValues', () => {
  it('valida nombre, dirección y teléfono; dirección y teléfono pueden quedar vacíos', () => {
    const result = sanitizeSucursalValues({ nombre: ' Centro ', direccion: '', telefono: 55512345 })
    expect(result.errores).toEqual([])
    expect(result.values).toEqual({ nombre: 'Centro', direccion: '', telefono: '55512345' })
    expect(sanitizeSucursalValues({ nombre: '  ' }).errores).toHaveLength(1)
    expect(sanitizeSucursalValues({ direccion: 5 }).errores).toHaveLength(1)
  })

  it('descarta credenciales sin repetir el valor y reporta lo que no es un campo', () => {
    const result = sanitizeSucursalValues({ nombre: 'Centro', clave: 'Secreto123!', activo: false })
    expect(result.values).toEqual({ nombre: 'Centro' })
    expect(result.credenciales).toEqual(['clave'])
    expect(result.ignorados).toEqual(['activo'])
    expect(JSON.stringify(result)).not.toContain('Secreto123!')
  })
})

describe('tools de /administracion/sucursales', () => {
  const context = (over: Partial<SucursalesAgentContext> = {}) => {
    const lista = [sucursal(1), sucursal(2, { activo: false })]
    const ctx = {
      getSucursales: () => lista,
      getFiltered: () => lista,
      getTexto: () => '',
      setTexto: vi.fn(),
      isLoading: () => false,
      isDialogOpen: () => false,
      isDeleteOpen: () => false,
      openNew: vi.fn(),
      openEdit: vi.fn(),
      openDeactivate: vi.fn(),
      goToEquipo: vi.fn(),
      ...over,
    } satisfies SucursalesAgentContext
    return ctx
  }

  it('abrir_nueva_sucursal precarga solo valores válidos y no guarda', async () => {
    const ctx = context()
    const def = tool(buildSucursalesTools(ctx), 'abrir_nueva_sucursal')
    expect(def.abreUi).toBe(true)
    expect((await ejecutar(def, { nombre: 'Norte', telefono: '5555' })).ok).toBe(true)
    expect(ctx.openNew).toHaveBeenCalledWith({ nombre: 'Norte', telefono: '5555' })
    expect((await ejecutar(def, { nombre: '' })).ok).toBe(false)
  })

  it('abrir_editar_sucursal y abrir_desactivar_sucursal solo operan sobre la lista cargada', async () => {
    const ctx = context()
    const tools = buildSucursalesTools(ctx)
    expect((await ejecutar(tool(tools, 'abrir_editar_sucursal'), { sucursal_id: 9 })).ok).toBe(false)
    expect((await ejecutar(tool(tools, 'abrir_editar_sucursal'), { sucursal_id: 1, direccion: 'Nueva' })).ok).toBe(true)
    expect(ctx.openEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), { direccion: 'Nueva' })
    expect((await ejecutar(tool(tools, 'abrir_desactivar_sucursal'), { sucursal_id: 1 })).ok).toBe(true)
    expect(ctx.openDeactivate).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('no desactiva una sucursal que ya está inactiva', async () => {
    const ctx = context()
    expect(errorOf(await ejecutar(tool(buildSucursalesTools(ctx), 'abrir_desactivar_sucursal'), { sucursal_id: 2 }))).toMatch(/ya esta inactiva/)
    expect(ctx.openDeactivate).not.toHaveBeenCalled()
  })

  it('con un diálogo abierto, todas las tools que abren algo fallan', async () => {
    for (const over of [{ isDialogOpen: () => true }, { isDeleteOpen: () => true }]) {
      const tools = buildSucursalesTools(context(over))
      for (const [name, args] of [
        ['abrir_nueva_sucursal', {}],
        ['abrir_editar_sucursal', { sucursal_id: 1 }],
        ['abrir_desactivar_sucursal', { sucursal_id: 1 }],
        ['ver_equipo_sucursal', { sucursal_id: 1 }],
      ] as const) {
        expect(errorOf(await ejecutar(tool(tools, name), args)), name).toMatch(/abiert/i)
      }
    }
  })

  it('ver_equipo_sucursal navega al detalle con el id de la lista', async () => {
    const ctx = context()
    const def = tool(buildSucursalesTools(ctx), 'ver_equipo_sucursal')
    expect((await ejecutar(def, { sucursal_id: 99 })).ok).toBe(false)
    expect((await ejecutar(def, { sucursal_id: 2 })).ok).toBe(true)
    expect(ctx.goToEquipo).toHaveBeenCalledWith(2)
  })

  it('filtrar_sucursales acepta texto vacío y leer_sucursales acota a 30', async () => {
    const ctx = context({ getFiltered: () => Array.from({ length: 40 }, (_, i) => sucursal(i + 1)) })
    const tools = buildSucursalesTools(ctx)
    expect((await ejecutar(tool(tools, 'filtrar_sucursales'), { texto: '' })).ok).toBe(true)
    expect(ctx.setTexto).toHaveBeenCalledWith('')
    expect((await ejecutar(tool(tools, 'filtrar_sucursales'), {})).ok).toBe(false)
    const result = await tool(tools, 'leer_sucursales').run({})
    expect(result.ok && (result.data as { sucursales: unknown[]; coinciden: number })).toMatchObject({ coinciden: 40 })
    expect(result.ok && (result.data as { sucursales: unknown[] }).sucursales).toHaveLength(30)
  })

  it('llenar_formulario_sucursal aplica valores válidos y falla si no hay ninguno', async () => {
    const setValues = vi.fn()
    const def = tool(buildSucursalDialogTools({ getValues: () => ({ nombre: 'x', direccion: '', telefono: '' }), setValues }), 'llenar_formulario_sucursal')
    expect((await def.run({ nombre: 'Sur', clave: 'Secreto123!' })).ok).toBe(true)
    expect(setValues).toHaveBeenCalledWith({ nombre: 'Sur' })
    expect((await def.run({ nombre: '' })).ok).toBe(false)
    expect((await def.run({})).ok).toBe(false)
  })
})

describe('tools del equipo de una sucursal', () => {
  const asignados = [
    { id: 1, username: 'ana', full_name: 'Ana Perez' },
    { id: 2, username: 'luis', full_name: 'Luis Gomez' },
  ]
  const context = (over: Partial<EquipoAgentContext> = {}) => {
    const ctx = {
      getSucursal: () => ({ id: 4, nombre: 'Centro', activo: true }),
      getAsignados: () => asignados,
      getFiltrados: () => asignados,
      getDisponibles: () => [{ id: 3, nombre: 'Maria Lopez' }],
      getTexto: () => '',
      setTexto: vi.fn(),
      isLoading: () => false,
      isBusy: () => false,
      agregar: vi.fn(async () => true),
      quitar: vi.fn(async () => true),
      ...over,
    } satisfies EquipoAgentContext
    return ctx
  }

  it('agregar y quitar piden confirmación, con validar y texto', () => {
    const tools = buildEquipoTools(context())
    for (const name of ['agregar_vendedor_sucursal', 'quitar_vendedor_sucursal']) {
      const def = tool(tools, name)
      expect(def.requiere_confirmacion, name).toBe(true)
      expect(typeof def.validar, name).toBe('function')
      expect(typeof def.textoConfirmacion, name).toBe('function')
    }
  })

  it('agregar_vendedor_sucursal solo acepta vendedores disponibles y el texto nombra al vendedor y la sucursal', async () => {
    const ctx = context()
    const def = tool(buildEquipoTools(ctx), 'agregar_vendedor_sucursal')
    expect(def.validar?.({ usuario_id: 99 })).toMatch(/no es un vendedor disponible/)
    // Ya pertenece al equipo: mensaje específico y no se ejecuta.
    expect(def.validar?.({ usuario_id: 1 })).toMatch(/Ana Perez ya pertenece al equipo de Centro/)
    expect(def.validar?.({ usuario_id: 3 })).toBeNull()
    expect(def.textoConfirmacion?.({ usuario_id: 3 })).toBe('Agregar a Maria Lopez al equipo de Centro')
    expect((await ejecutar(def, { usuario_id: 3 })).ok).toBe(true)
    expect(ctx.agregar).toHaveBeenCalledWith(3)
    expect((await ejecutar(def, { usuario_id: 99 })).ok).toBe(false)
  })

  it('quitar_vendedor_sucursal solo acepta miembros actuales y el texto nombra al miembro y la sucursal', async () => {
    const ctx = context()
    const def = tool(buildEquipoTools(ctx), 'quitar_vendedor_sucursal')
    expect(def.validar?.({ usuario_id: 3 })).toMatch(/no es miembro actual/)
    expect(def.validar?.({ usuario_id: 2 })).toBeNull()
    const text = def.textoConfirmacion?.({ usuario_id: 2 })
    expect(text).toContain('Luis Gomez')
    expect(text).toContain('Centro')
    expect((await ejecutar(def, { usuario_id: 2 })).ok).toBe(true)
    expect(ctx.quitar).toHaveBeenCalledWith(2)
  })

  it('no acepta cambios de equipo mientras hay otro en curso y reporta el fallo', async () => {
    const busy = tool(buildEquipoTools(context({ isBusy: () => true })), 'agregar_vendedor_sucursal')
    expect(busy.validar?.({ usuario_id: 3 })).toMatch(/en curso/)
    const failing = tool(buildEquipoTools(context({ agregar: async () => false })), 'agregar_vendedor_sucursal')
    expect((await failing.run({ usuario_id: 3 })).ok).toBe(false)
  })

  it('leer_equipo usa la lista filtrada y filtrar_equipo acepta texto vacío', async () => {
    const ctx = context({ getFiltrados: () => [asignados[1]], getTexto: () => 'luis' })
    const tools = buildEquipoTools(ctx)
    const result = await tool(tools, 'leer_equipo').run({})
    expect(result.ok && (result.data as { asignados: unknown[]; total_asignados: number; coinciden: number })).toMatchObject({ total_asignados: 2, coinciden: 1 })
    expect((await ejecutar(tool(tools, 'filtrar_equipo'), { texto: '' })).ok).toBe(true)
    expect((await ejecutar(tool(tools, 'filtrar_equipo'), {})).ok).toBe(false)
  })
})

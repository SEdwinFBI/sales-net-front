import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { DestinatarioNotificacion } from '../notifications/types/notificaciones-types'
import {
  buildCobrosScheduleTools,
  buildDestinatarioDialogTools,
  buildDestinatariosTools,
  planCobrosSchedule,
  sanitizeDestinatarioValues,
  type DestinatariosAgentContext,
  type ScheduleAgentContext,
  type ScheduleState,
} from './notificaciones-tools'

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

// -- Programación de cobros --------------------------------------------------------------------

const state = (over: Partial<ScheduleState> = {}): ScheduleState => ({
  dias: [1, 2, 3],
  horas: [],
  horasGuardadas: ['07:15'],
  lastDias: [1, 2, 3, 4, 5, 6, 7],
  ...over,
})

describe('planCobrosSchedule', () => {
  it('exige al menos un cambio', () => {
    expect(planCobrosSchedule({}, state())).toHaveProperty('error')
  })

  it('valida los días (1 a 7), los ordena y quita repetidos', () => {
    expect(planCobrosSchedule({ dias: [5, 1, 5, 3] }, state())).toEqual({ dias: [1, 3, 5] })
    for (const dias of [[0], [8], [1.5], ['lunes'], 'todos']) {
      expect(planCobrosSchedule({ dias }, state()), JSON.stringify(dias)).toHaveProperty('error')
    }
  })

  it('activo=false pausa los avisos y activo=true los reactiva con los últimos días', () => {
    expect(planCobrosSchedule({ activo: false }, state())).toEqual({ dias: [] })
    expect(planCobrosSchedule({ activo: true }, state({ dias: [] }))).toEqual({ dias: [1, 2, 3, 4, 5, 6, 7] })
    expect(planCobrosSchedule({ activo: true }, state())).toEqual({ dias: [1, 2, 3] })
    expect(planCobrosSchedule({ activo: true, dias: [2] }, state())).toEqual({ dias: [2] })
  })

  it('rechaza combinaciones contradictorias', () => {
    expect(planCobrosSchedule({ activo: false, dias: [1] }, state())).toHaveProperty('error')
    expect(planCobrosSchedule({ activo: true, dias: [] }, state())).toHaveProperty('error')
    expect(planCobrosSchedule({ activo: 'si' }, state())).toHaveProperty('error')
    expect(planCobrosSchedule({ horario: 'default', horas: ['08:00'] }, state())).toHaveProperty('error')
  })

  it('valida las horas HH:MM sin repetir', () => {
    expect(planCobrosSchedule({ horas: ['08:00', '17:30'] }, state())).toEqual({ horas: ['08:00', '17:30'] })
    for (const horas of [[], ['25:00'], ['8:00'], ['08:00', '08:00'], ['08:60'], 'ocho', Array.from({ length: 11 }, (_, i) => `0${i % 10}:${10 + i}`)]) {
      expect(planCobrosSchedule({ horas }, state()), JSON.stringify(horas)).toHaveProperty('error')
    }
  })

  it("horario 'default' vacía las horas y 'custom' recupera las guardadas o exige horas", () => {
    expect(planCobrosSchedule({ horario: 'default' }, state({ horas: ['09:00'] }))).toEqual({ horas: [] })
    expect(planCobrosSchedule({ horario: 'custom' }, state())).toEqual({ horas: ['07:15'] })
    expect(planCobrosSchedule({ horario: 'custom' }, state({ horasGuardadas: [] }))).toHaveProperty('error')
    expect(planCobrosSchedule({ horario: 'custom', horas: ['10:00'] }, state({ horasGuardadas: [] }))).toEqual({ horas: ['10:00'] })
    expect(planCobrosSchedule({ horario: 'mixto' }, state())).toHaveProperty('error')
  })
})

describe('tools de la programación de cobros', () => {
  const context = (over: Partial<ScheduleState> = {}) => {
    const apply = vi.fn()
    const ctx: ScheduleAgentContext = {
      getState: () => ({
        ...state(over),
        diasGuardados: [1],
        hasChanges: false,
        valid: true,
        zonaHoraria: 'America/Guatemala',
        ultimoEnvio: '2026-10-10',
      }),
      apply,
    }
    return { ctx, apply }
  }

  it('editar_programacion_cobros solo modifica el borrador y lo dice', async () => {
    const { ctx, apply } = context()
    const def = tool(buildCobrosScheduleTools(ctx), 'editar_programacion_cobros')
    expect(def.requiere_confirmacion).toBeUndefined()
    expect(def.description).toMatch(/BORRADOR/)
    expect(def.description).toMatch(/Guardar programacion/)
    const result = await ejecutar(def, { dias: [1, 5], horas: ['08:00'] })
    expect(result.ok).toBe(true)
    expect(JSON.stringify(result)).toMatch(/Guardar programacion/)
    expect(apply).toHaveBeenCalledWith({ dias: [1, 5], horas: ['08:00'] })
  })

  it('un cambio inválido no toca el borrador', async () => {
    const { ctx, apply } = context()
    const def = tool(buildCobrosScheduleTools(ctx), 'editar_programacion_cobros')
    expect(errorOf(await ejecutar(def, { dias: [9] }))).toMatch(/dias/)
    expect(apply).not.toHaveBeenCalled()
  })

  it('leer_programacion_cobros describe el borrador y lo guardado', async () => {
    const { ctx } = context({ dias: [] })
    const result = await tool(buildCobrosScheduleTools(ctx), 'leer_programacion_cobros').run({})
    expect(result.ok && result.data).toMatchObject({
      activo: false,
      dias_texto: 'avisos pausados',
      horario: 'default',
      guardado: { dias: [1], horas: ['07:15'] },
      zona_horaria: 'America/Guatemala',
    })
  })
})

// -- Destinatarios -----------------------------------------------------------------------------

const destinatario = (id: number, extra: Partial<DestinatarioNotificacion> = {}): DestinatarioNotificacion => ({
  id,
  email: `persona${id}@empresa.com`,
  nombre_persona_email: `Persona ${id}`,
  recibir_stock_bajo: true,
  recibir_abonos: true,
  recibir_clientes_deudas: false,
  recibir_ventas_realizadas: false,
  ...extra,
})

describe('sanitizeDestinatarioValues', () => {
  it('valida el formato del correo, el nombre y las preferencias', () => {
    expect(sanitizeDestinatarioValues({ email: 'sin-arroba' }).errores).toHaveLength(1)
    expect(sanitizeDestinatarioValues({ email: 'a@b' }).errores).toHaveLength(1)
    expect(sanitizeDestinatarioValues({ email: 'a b@c.com' }).errores).toHaveLength(1)
    expect(sanitizeDestinatarioValues({ email: '' }).errores).toHaveLength(1)
    expect(sanitizeDestinatarioValues({ nombre: ' ' }).errores).toHaveLength(1)
    expect(sanitizeDestinatarioValues({ recibir_abonos: 'si' }).errores).toHaveLength(1)
    const good = sanitizeDestinatarioValues({ email: ' ana@empresa.com ', nombre: 'Ana', recibir_abonos: false })
    expect(good.errores).toEqual([])
    expect(good.values).toEqual({ email: 'ana@empresa.com', nombre: 'Ana', recibir_abonos: false })
  })

  it('descarta credenciales sin repetir el valor', () => {
    const result = sanitizeDestinatarioValues({ email: 'ana@empresa.com', password: 'Secreto123!' })
    expect(result.credenciales).toEqual(['password'])
    expect(JSON.stringify(result.values)).not.toContain('Secreto123!')
  })
})

describe('tools de destinatarios', () => {
  const context = (over: Partial<DestinatariosAgentContext> = {}) => {
    const visibles = [destinatario(1), destinatario(2)]
    const ctx = {
      getVisible: () => visibles,
      getTotal: () => 25,
      getPage: () => ({ page: 1, totalPages: 3 }),
      getTexto: () => '',
      setTexto: vi.fn(),
      isLoading: () => false,
      hasUnsavedChanges: () => false,
      setPreferencias: vi.fn(),
      isDialogOpen: () => false,
      isDeleteOpen: () => false,
      openNew: vi.fn(),
      openDelete: vi.fn(),
      ...over,
    } satisfies DestinatariosAgentContext
    return ctx
  }

  it('cambiar_preferencias_destinatario solo toca el borrador de un destinatario de la página visible', async () => {
    const ctx = context()
    const def = tool(buildDestinatariosTools(ctx), 'cambiar_preferencias_destinatario')
    expect(def.requiere_confirmacion).toBeUndefined()
    expect(def.description).toMatch(/BORRADOR/)
    expect(def.description).toMatch(/Guardar preferencias/)
    const result = await ejecutar(def, { destinatario_id: 2, recibir_ventas_realizadas: true })
    expect(result.ok).toBe(true)
    expect(JSON.stringify(result)).toMatch(/Guardar preferencias/)
    expect(ctx.setPreferencias).toHaveBeenCalledWith(2, { recibir_ventas_realizadas: true })
  })

  it('si el destinatario no está en la página visible, el error manda a filtrar_destinatarios primero', async () => {
    const ctx = context()
    const def = tool(buildDestinatariosTools(ctx), 'cambiar_preferencias_destinatario')
    const error = errorOf(await ejecutar(def, { destinatario_id: 77, recibir_abonos: false }))
    expect(error).toMatch(/pagina visible/)
    expect(error).toMatch(/filtrar_destinatarios/)
    expect(ctx.setPreferencias).not.toHaveBeenCalled()
  })

  it('exige al menos una preferencia booleana', async () => {
    const def = tool(buildDestinatariosTools(context()), 'cambiar_preferencias_destinatario')
    expect((await ejecutar(def, { destinatario_id: 1 })).ok).toBe(false)
    expect((await ejecutar(def, { destinatario_id: 1, recibir_abonos: 'no' })).ok).toBe(false)
  })

  it('filtrar_destinatarios falla si hay preferencias sin guardar (cambiar la lista las descartaría)', async () => {
    const ctx = context({ hasUnsavedChanges: () => true })
    const def = tool(buildDestinatariosTools(ctx), 'filtrar_destinatarios')
    expect(errorOf(await ejecutar(def, { texto: 'ana' }))).toMatch(/sin guardar/)
    expect(ctx.setTexto).not.toHaveBeenCalled()

    const free = context()
    expect((await ejecutar(tool(buildDestinatariosTools(free), 'filtrar_destinatarios'), { texto: ' ana ' })).ok).toBe(true)
    expect(free.setTexto).toHaveBeenCalledWith('ana')
  })

  it('abrir_nuevo_destinatario valida el correo y precarga el formulario', async () => {
    const ctx = context()
    const def = tool(buildDestinatariosTools(ctx), 'abrir_nuevo_destinatario')
    expect(def.abreUi).toBe(true)
    expect(errorOf(await ejecutar(def, { email: 'no-valido' }))).toMatch(/correo valido/)
    expect(ctx.openNew).not.toHaveBeenCalled()
    expect((await ejecutar(def, { nombre: 'Ana', email: 'ana@empresa.com', recibir_stock_bajo: false })).ok).toBe(true)
    expect(ctx.openNew).toHaveBeenCalledWith({ nombre: 'Ana', email: 'ana@empresa.com', recibir_stock_bajo: false })
  })

  it('con un diálogo abierto, abrir_nuevo_destinatario y abrir_eliminar_destinatario fallan', async () => {
    for (const over of [{ isDialogOpen: () => true }, { isDeleteOpen: () => true }]) {
      const tools = buildDestinatariosTools(context(over))
      expect(errorOf(await ejecutar(tool(tools, 'abrir_nuevo_destinatario'), {}))).toMatch(/abiert/i)
      expect(errorOf(await ejecutar(tool(tools, 'abrir_eliminar_destinatario'), { destinatario_id: 1 }))).toMatch(/abiert/i)
    }
  })

  it('abrir_eliminar_destinatario solo opera sobre la página visible', async () => {
    const ctx = context()
    const def = tool(buildDestinatariosTools(ctx), 'abrir_eliminar_destinatario')
    expect((await ejecutar(def, { destinatario_id: 77 })).ok).toBe(false)
    expect((await ejecutar(def, { destinatario_id: 1 })).ok).toBe(true)
    expect(ctx.openDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('leer_notificaciones informa página, total y si hay cambios sin guardar', async () => {
    const result = await tool(buildDestinatariosTools(context({ hasUnsavedChanges: () => true })), 'leer_notificaciones').run({})
    expect(result.ok && result.data).toMatchObject({ total: 25, pagina: 1, paginas: 3, cambios_sin_guardar: true })
    expect(result.ok && (result.data as { destinatarios: unknown[] }).destinatarios).toHaveLength(2)
  })

  it('llenar_formulario_destinatario valida el correo y no guarda', async () => {
    const setValues = vi.fn()
    const def = tool(
      buildDestinatarioDialogTools({ getValues: () => ({ nombre: '', email: '' }), setValues }),
      'llenar_formulario_destinatario',
    )
    expect((await def.run({ email: 'malo' })).ok).toBe(false)
    expect(setValues).not.toHaveBeenCalled()
    expect((await def.run({ nombre: 'Ana', email: 'ana@empresa.com' })).ok).toBe(true)
    expect(setValues).toHaveBeenCalledWith({ nombre: 'Ana', email: 'ana@empresa.com' })
  })
})

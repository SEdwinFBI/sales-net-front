import { describe, expect, it, vi } from 'vitest'
import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import { CREDENTIAL_NOTICE } from '@/features/agent/tool-helpers'
import type { Usuario } from '../users/types/usuario-types'
import {
  FALTA_CONTRASENA,
  buildUsuarioDialogTools,
  buildUsuariosTools,
  planPermisos,
  sanitizeUsuarioValues,
  type UsuarioDialogAgentContext,
  type UsuariosAgentContext,
} from './usuarios-tools'

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

const usuario = (id: number, extra: Partial<Usuario> = {}): Usuario => ({
  id,
  username: `user${id}`,
  first_name: 'Nombre',
  last_name: `Apellido${id}`,
  email: `user${id}@correo.com`,
  fullName: `Nombre Apellido${id}`,
  role: 'vendedor',
  is_active: true,
  puede_anular: true,
  evidencia_fotografica: true,
  created_at: '2026-01-01',
  hora_entrada: '04:00:00',
  hora_salida: '16:00:00',
  sucursales: [1],
  ...extra,
})

const SECRET = 'Secreto123!'

/** Texto de la respuesta sin la lista de NOMBRES de claves descartadas (lo único que se reporta de una credencial). */
const textWithoutDiscarded = (result: unknown) =>
  JSON.stringify(result, (key, value) => (key === 'credenciales_descartadas' ? undefined : value)).toLowerCase()

function context(over: Partial<UsuariosAgentContext> = {}) {
  const usuarios = [usuario(1), usuario(2, { role: 'admin', puede_anular: false }), usuario(3, { evidencia_fotografica: false })]
  const ctx = {
    getUsuarios: () => usuarios,
    getFiltered: () => usuarios,
    getFilters: () => ({ texto: '', rol: 'todos' as const }),
    setFilters: vi.fn(),
    getSucursalIds: () => [1, 2],
    isDialogOpen: () => false,
    isDeleteOpen: () => false,
    openNew: vi.fn(),
    openEdit: vi.fn(),
    openDelete: vi.fn(),
    updatePermisos: vi.fn(async () => true),
    isUpdating: () => false,
    ...over,
  } satisfies UsuariosAgentContext
  return ctx
}

describe('sanitizeUsuarioValues', () => {
  it('descarta cualquier clave de credencial y solo reporta su nombre, nunca el valor', () => {
    const result = sanitizeUsuarioValues({
      first_name: 'Ana',
      password: SECRET,
      Contraseña: SECRET,
      clave: SECRET,
      pin: SECRET,
      patron: SECRET,
      passkey: SECRET,
      token: SECRET,
    })
    expect(result.values).toEqual({ first_name: 'Ana' })
    expect(result.credenciales.sort()).toEqual(['Contraseña', 'clave', 'passkey', 'password', 'patron', 'pin', 'token'].sort())
    expect(JSON.stringify(result)).not.toContain(SECRET)
    expect(result.ignorados).toEqual([])
  })

  it('valida correo, horas, rol y sucursales', () => {
    const bad = sanitizeUsuarioValues({ email: 'no-es-correo', hora_entrada: '25:00', role: 'jefe', sucursales: [1, 99] }, { sucursalIds: [1, 2] })
    expect(bad.errores).toHaveLength(4)
    expect(bad.values).toEqual({})

    const good = sanitizeUsuarioValues({ email: '', username: ' ana ', role: 'Vendedor', hora_salida: '18:30', sucursales: [2, 2] }, { sucursalIds: [1, 2] })
    expect(good.errores).toEqual([])
    expect(good.values).toEqual({ email: '', username: 'ana', role: 'vendedor', hora_salida: '18:30', sucursales: [2] })
  })

  it('un administrador no tiene sucursales', () => {
    const result = sanitizeUsuarioValues({ role: 'admin', sucursales: [1] }, { sucursalIds: [1] })
    expect(result.values).toEqual({ role: 'admin' })
    expect(result.notas).toHaveLength(1)
    expect(sanitizeUsuarioValues({ sucursales: [1] }, { sucursalIds: [1], currentRole: 'admin' }).values).toEqual({})
  })

  it('reporta como no permitido lo que no es un campo del formulario', () => {
    expect(sanitizeUsuarioValues({ is_active: true, id: 3 }).ignorados.sort()).toEqual(['id', 'is_active'])
  })
})

describe('abrir_nuevo_usuario', () => {
  it('siempre avisa que falta la contraseña y nunca la maneja', async () => {
    const ctx = context()
    const def = tool(buildUsuariosTools(ctx), 'abrir_nuevo_usuario')
    for (const args of [{}, { first_name: 'Ana', username: 'ana' }, { first_name: 'Ana', password: SECRET, contrasena: SECRET }]) {
      const result = await ejecutar(def, args)
      expect(result.ok).toBe(true)
      const text = JSON.stringify(result)
      expect(text).toContain(FALTA_CONTRASENA)
      expect(text).not.toContain(SECRET)
      expect(textWithoutDiscarded(result)).not.toContain('password')
    }
    expect(ctx.openNew).toHaveBeenLastCalledWith({ first_name: 'Ana' })
    const withSecret = await def.run({ password: SECRET })
    expect(JSON.stringify(withSecret)).toContain(CREDENTIAL_NOTICE)
    // El diálogo recibe valores sin credenciales (nada que precargar).
    expect(ctx.openNew).toHaveBeenLastCalledWith(undefined)
  })

  it('con un diálogo abierto falla en vez de reabrirlo', async () => {
    const def = tool(buildUsuariosTools(context({ isDialogOpen: () => true })), 'abrir_nuevo_usuario')
    expect(errorOf(await ejecutar(def, {}))).toMatch(/abiert/i)
    expect(tool(buildUsuariosTools(context({ isDeleteOpen: () => true })), 'abrir_editar_usuario').validar?.({ usuario_id: 1 })).toMatch(/abiert/i)
  })
})

describe('abrir_editar_usuario y abrir_eliminar_usuario', () => {
  it('solo abren usuarios de la lista cargada', async () => {
    const ctx = context()
    const tools = buildUsuariosTools(ctx)
    expect((await ejecutar(tool(tools, 'abrir_editar_usuario'), { usuario_id: 99 })).ok).toBe(false)
    expect((await ejecutar(tool(tools, 'abrir_eliminar_usuario'), { usuario_id: 99 })).ok).toBe(false)
    expect((await ejecutar(tool(tools, 'abrir_editar_usuario'), { usuario_id: 1, username: 'nuevo', password: SECRET })).ok).toBe(true)
    expect(ctx.openEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), { username: 'nuevo' })
    expect((await ejecutar(tool(tools, 'abrir_eliminar_usuario'), { usuario_id: 3 })).ok).toBe(true)
    expect(ctx.openDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
  })

  it('al editar a un admin ignora las sucursales', async () => {
    const ctx = context()
    await ejecutar(tool(buildUsuariosTools(ctx), 'abrir_editar_usuario'), { usuario_id: 2, sucursales: [1], username: 'jefe' })
    expect(ctx.openEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), { username: 'jefe' })
  })
})

describe('leer_usuarios', () => {
  it('devuelve solo id, nombre, username, rol y permisos: sin correo ni nada parecido a credenciales', async () => {
    const result = await tool(buildUsuariosTools(context()), 'leer_usuarios').run({})
    expect(result.ok).toBe(true)
    const text = JSON.stringify(result)
    expect(text).not.toMatch(/email|correo|@|password|contrase|hora_/i)
    const lista = result.ok ? (result.data as { usuarios: Record<string, unknown>[] }).usuarios : []
    expect(Object.keys(lista[0]).sort()).toEqual(['evidencia_fotografica', 'id', 'nombre', 'puede_anular', 'rol', 'username'])
    // El admin siempre puede anular, aunque el dato guardado diga otra cosa.
    expect(lista[1]).toMatchObject({ rol: 'admin', puede_anular: true })
  })

  it('acota a 30 filas', async () => {
    const muchos = Array.from({ length: 45 }, (_, i) => usuario(i + 1))
    const result = await tool(buildUsuariosTools(context({ getFiltered: () => muchos })), 'leer_usuarios').run({})
    expect(result.ok && (result.data as { usuarios: unknown[]; total: number })).toMatchObject({ total: 45 })
    expect(result.ok && (result.data as { usuarios: unknown[] }).usuarios).toHaveLength(30)
  })
})

describe('filtrar_usuarios', () => {
  it('valida el rol y pasa el texto recortado', async () => {
    const ctx = context()
    const def = tool(buildUsuariosTools(ctx), 'filtrar_usuarios')
    expect((await ejecutar(def, { texto: ' ana ', rol: 'Vendedor' })).ok).toBe(true)
    expect(ctx.setFilters).toHaveBeenCalledWith({ texto: 'ana', rol: 'vendedor' })
    expect((await ejecutar(def, { rol: 'jefe' })).ok).toBe(false)
    expect((await ejecutar(def, {})).ok).toBe(false)
  })
})

describe('cambiar_permisos_usuario [conf]', () => {
  it('pide confirmación y valida ANTES de confirmar', () => {
    const def = tool(buildUsuariosTools(context()), 'cambiar_permisos_usuario')
    expect(def.requiere_confirmacion).toBe(true)
    expect(def.validar?.({ usuario_id: 99, puede_anular: false })).toMatch(/No encontre/)
    expect(def.validar?.({ usuario_id: 1 })).toMatch(/al menos un permiso/)
    expect(def.validar?.({ usuario_id: 1, puede_anular: 'no' })).toMatch(/true o false/)
    // puede_anular no aplica a un admin.
    expect(def.validar?.({ usuario_id: 2, puede_anular: false })).toMatch(/administrador/)
    // Ya tiene ese valor: no hay nada que confirmar.
    expect(def.validar?.({ usuario_id: 1, puede_anular: true })).toMatch(/No cambia nada/)
    expect(def.validar?.({ usuario_id: 1, puede_anular: false })).toBeNull()
  })

  it('el texto sale del usuario real con antes → después', () => {
    const def = tool(buildUsuariosTools(context()), 'cambiar_permisos_usuario')
    const text = def.textoConfirmacion?.({ usuario_id: 1, puede_anular: false, evidencia_fotografica: false })
    expect(text).toContain('Nombre Apellido1')
    expect(text).toContain('user1')
    expect(text).toContain('Anular ventas y abonos: permitido → no permitido')
    expect(text).toContain('Evidencia fotografica: activada → desactivada')
    // Solo lo que cambia: la evidencia ya estaba desactivada en el usuario 3.
    const solo = def.textoConfirmacion?.({ usuario_id: 3, evidencia_fotografica: false, puede_anular: false })
    expect(solo).not.toContain('Evidencia')
    expect(solo).toContain('Anular')
  })

  it('al correr usa la misma actualización que el checkbox, solo con lo que cambia', async () => {
    const ctx = context()
    const def = tool(buildUsuariosTools(ctx), 'cambiar_permisos_usuario')
    expect((await def.run({ usuario_id: 3, evidencia_fotografica: true, puede_anular: true })).ok).toBe(true)
    expect(ctx.updatePermisos).toHaveBeenCalledWith(3, { evidencia_fotografica: true })
    const falla = context({ updatePermisos: async () => false })
    expect((await tool(buildUsuariosTools(falla), 'cambiar_permisos_usuario').run({ usuario_id: 1, puede_anular: false })).ok).toBe(false)
  })

  it('no acepta cambios mientras otro se está aplicando', () => {
    const def = tool(buildUsuariosTools(context({ isUpdating: () => true })), 'cambiar_permisos_usuario')
    expect(def.validar?.({ usuario_id: 1, puede_anular: false })).toMatch(/actualizando/)
  })
})

describe('planPermisos', () => {
  it('ignora cualquier campo que no sea un permiso (jamás una credencial)', () => {
    const plan = planPermisos({ usuario_id: 1, puede_anular: false, password: SECRET }, [usuario(1)])
    expect('error' in plan).toBe(false)
    expect(JSON.stringify(plan)).not.toContain(SECRET)
    if (!('error' in plan)) expect(plan.cambios).toEqual({ puede_anular: false })
  })
})

describe('llenar_formulario_usuario', () => {
  const dialog = (over: Partial<UsuarioDialogAgentContext> = {}) => {
    const setValues = vi.fn()
    const ctx: UsuarioDialogAgentContext = {
      getRole: () => 'vendedor',
      getSucursalIds: () => [1, 2],
      getValues: () => ({
        first_name: 'Ana',
        last_name: 'Perez',
        email: '',
        username: 'ana',
        role: 'vendedor',
        hora_entrada: '04:00',
        hora_salida: '16:00',
        sucursales: [1],
      }),
      setValues,
      ...over,
    }
    return { ctx, setValues }
  }

  it('llena los campos válidos, descarta credenciales y devuelve valores sin contraseña', async () => {
    const { ctx, setValues } = dialog()
    const result = await tool(buildUsuarioDialogTools(ctx), 'llenar_formulario_usuario').run({
      first_name: 'Ana',
      password: SECRET,
      sucursales: [2],
    })
    expect(result.ok).toBe(true)
    expect(setValues).toHaveBeenCalledWith({ first_name: 'Ana', sucursales: [2] })
    const text = JSON.stringify(result)
    expect(text).not.toContain(SECRET)
    expect(textWithoutDiscarded(result)).not.toContain('password')
    expect(text).toContain(CREDENTIAL_NOTICE)
    expect(text).toContain('credenciales_descartadas')
  })

  it('si solo llegan credenciales o campos inválidos falla sin llenar nada', async () => {
    const { ctx, setValues } = dialog()
    const def = tool(buildUsuarioDialogTools(ctx), 'llenar_formulario_usuario')
    const onlyPassword = await def.run({ password: SECRET })
    expect(onlyPassword.ok).toBe(false)
    expect(JSON.stringify(onlyPassword)).not.toContain(SECRET)
    expect((await def.run({ email: 'x' })).ok).toBe(false)
    expect(setValues).not.toHaveBeenCalled()
  })

  it('sus parámetros no incluyen ningún campo de contraseña', () => {
    const def = tool(buildUsuarioDialogTools(dialog().ctx), 'llenar_formulario_usuario')
    expect(Object.keys((def.parameters as { properties: object }).properties).join(' ')).not.toMatch(/pass|contra|clave|pin|patron/i)
  })
})

import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  CREDENTIAL_NOTICE,
  MAX_READ_ROWS,
  NO_PARAMS,
  cleanText,
  fail,
  isCredentialKey,
  limitRows,
  matchOption,
  ok,
  positiveInt,
} from '@/features/agent/tool-helpers'
import type { ToolResult } from '@/features/agent/types'
import type { Usuario } from '../users/types/usuario-types'

export type UsuarioFormValues = {
  first_name: string
  last_name: string
  email: string
  username: string
  role: 'admin' | 'vendedor'
  hora_entrada: string
  hora_salida: string
  sucursales: number[]
}

export type SanitizedUsuario = {
  values: Partial<UsuarioFormValues>
  /** Claves que no son campos del formulario. */
  ignorados: string[]
  /** Claves que parecen una credencial: solo se reporta el NOMBRE, nunca el valor. */
  credenciales: string[]
  errores: string[]
  notas: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Frase que SIEMPRE acompaña a abrir un usuario nuevo: la contraseña la escribe el usuario. */
export const FALTA_CONTRASENA = 'Falta que el usuario escriba la contraseña antes de guardar.'

/**
 * Valida los campos del formulario de usuario que propone el modelo. NO existe campo de
 * contraseña: cualquier clave tipo password/contraseña/clave/token/pin/patrón se descarta
 * y solo se reporta su nombre. Un admin no tiene sucursales (el formulario no las muestra).
 */
export function sanitizeUsuarioValues(
  raw: unknown,
  { sucursalIds, currentRole }: { sucursalIds?: readonly number[]; currentRole?: string | null } = {},
): SanitizedUsuario {
  const result: SanitizedUsuario = { values: {}, ignorados: [], credenciales: [], errores: [], notas: [] }
  if (raw === undefined || raw === null) return result
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del usuario.')
    return result
  }

  const { values } = result
  for (const [key, value] of Object.entries(raw)) {
    if (isCredentialKey(key)) {
      result.credenciales.push(key)
      continue
    }
    switch (key) {
      case 'first_name':
      case 'last_name':
      case 'username': {
        const text = cleanText(value, 100)
        if (text === null) result.errores.push(`${key} debe ser un texto no vacio.`)
        else values[key] = text
        break
      }
      case 'email': {
        const email = typeof value === 'string' ? value.trim() : null
        if (email === null || (email !== '' && (!EMAIL_RE.test(email) || email.length > 254))) result.errores.push('email debe ser un correo valido (o vacio).')
        else values.email = email
        break
      }
      case 'role': {
        const role = matchOption(['admin', 'vendedor'], value)
        if (!role) result.errores.push("role debe ser 'admin' o 'vendedor'.")
        else values.role = role as UsuarioFormValues['role']
        break
      }
      case 'hora_entrada':
      case 'hora_salida':
        if (typeof value !== 'string' || !TIME_RE.test(value)) result.errores.push(`${key} debe tener formato HH:MM (00:00 a 23:59).`)
        else values[key] = value
        break
      case 'sucursales': {
        const valid = Array.isArray(value) && value.every((id) => positiveInt(id) !== null)
        if (!valid) {
          result.errores.push('sucursales debe ser una lista de ids de sucursal.')
          break
        }
        const ids = [...new Set(value as number[])]
        const desconocidas = sucursalIds ? ids.filter((id) => !sucursalIds.includes(id)) : []
        if (desconocidas.length > 0) result.errores.push(`Sucursales que no existen: ${desconocidas.join(', ')}.`)
        else values.sucursales = ids
        break
      }
      default:
        result.ignorados.push(key)
    }
  }

  const role = values.role ?? currentRole
  if (role === 'admin' && values.sucursales) {
    delete values.sucursales
    result.notas.push('Un administrador no tiene sucursales asignadas: se ignoraron.')
  }
  return result
}

const credentialExtras = (s: SanitizedUsuario) => (s.credenciales.length ? { credenciales_descartadas: s.credenciales, aviso: CREDENTIAL_NOTICE } : {})

/** Lo que UsuariosTable le presta al agente. */
export type UsuariosAgentContext = {
  getUsuarios: () => Usuario[]
  /** Usuarios tras los filtros de la tabla (todas las páginas). */
  getFiltered: () => Usuario[]
  getFilters: () => { texto: string; rol: 'todos' | 'admin' | 'vendedor' }
  setFilters: (filters: Partial<{ texto: string; rol: 'todos' | 'admin' | 'vendedor' }>) => void
  /** Sucursales existentes (para validar `sucursales`); undefined si aún no cargan. */
  getSucursalIds: () => readonly number[] | undefined
  /** El formulario de usuario (nuevo o edición) está abierto. */
  isDialogOpen: () => boolean
  isDeleteOpen: () => boolean
  openNew: (valores?: Partial<UsuarioFormValues>) => void
  openEdit: (usuario: Usuario, valores?: Partial<UsuarioFormValues>) => void
  openDelete: (usuario: Usuario) => void
  /** Misma `updateUsuario` que los checkboxes de la tabla; true si salió bien (el error ya se muestra). */
  updatePermisos: (usuarioId: number, cambios: { evidencia_fotografica?: boolean; puede_anular?: boolean }) => Promise<boolean>
  isUpdating: () => boolean
}

const FILL_TOOL = 'llenar_formulario_usuario'
const ROLES = ['todos', 'admin', 'vendedor'] as const

const nombreDe = (u: Pick<Usuario, 'fullName' | 'username'>) => u.fullName || u.username

/** Valores efectivos de los permisos, como los muestran los checkboxes de la tabla. */
export const permisosActuales = (u: Pick<Usuario, 'role' | 'evidencia_fotografica' | 'puede_anular'>) => ({
  evidencia_fotografica: u.evidencia_fotografica ?? true,
  puede_anular: u.role === 'admin' || (u.puede_anular ?? true),
})

export type PermisosPlan =
  | { usuario: Usuario; cambios: { evidencia_fotografica?: boolean; puede_anular?: boolean }; antes: ReturnType<typeof permisosActuales> }
  | { error: string }

/** Valida cambiar_permisos_usuario contra la lista cargada y deja solo lo que realmente cambia. */
export function planPermisos(args: Record<string, unknown>, usuarios: Usuario[]): PermisosPlan {
  const id = positiveInt(args.usuario_id)
  const usuario = id === null ? undefined : usuarios.find((u) => u.id === id)
  if (!usuario) return { error: 'No encontre ese usuario (ver leer_usuarios).' }

  const pedidos: { evidencia_fotografica?: boolean; puede_anular?: boolean } = {}
  for (const key of ['evidencia_fotografica', 'puede_anular'] as const) {
    if (!(key in args)) continue
    if (typeof args[key] !== 'boolean') return { error: `${key} debe ser true o false.` }
    pedidos[key] = args[key]
  }
  if (Object.keys(pedidos).length === 0) return { error: 'Indica al menos un permiso: evidencia_fotografica o puede_anular.' }
  if ('puede_anular' in pedidos && usuario.role === 'admin') {
    return { error: 'puede_anular no aplica a un administrador: los administradores siempre pueden anular.' }
  }

  const antes = permisosActuales(usuario)
  const cambios: { evidencia_fotografica?: boolean; puede_anular?: boolean } = {}
  for (const key of ['evidencia_fotografica', 'puede_anular'] as const) {
    if (key in pedidos && pedidos[key] !== antes[key]) cambios[key] = pedidos[key]
  }
  if (Object.keys(cambios).length === 0) return { error: `No cambia nada: ${nombreDe(usuario)} ya tiene esos valores.` }
  return { usuario, cambios, antes }
}

const FORM_PROPERTIES = {
  first_name: { type: 'string' },
  last_name: { type: 'string' },
  email: { type: 'string', description: 'Correo (opcional).' },
  username: { type: 'string' },
  role: { type: 'string', enum: ['admin', 'vendedor'] },
  hora_entrada: { type: 'string', description: 'HH:MM' },
  hora_salida: { type: 'string', description: 'HH:MM' },
  sucursales: { type: 'array', items: { type: 'integer' }, description: 'Ids de sucursal (solo vendedores).' },
} as const

/** Tools de /administracion/usuarios. Ninguna recibe ni devuelve contraseñas. */
export function buildUsuariosTools(ctx: UsuariosAgentContext): AgentToolDef[] {
  const findUsuario = (args: Record<string, unknown>) => {
    const id = positiveInt(args.usuario_id)
    return id === null ? undefined : ctx.getUsuarios().find((u) => u.id === id)
  }
  const NOT_FOUND = 'No encontre ese usuario (ver leer_usuarios).'
  /** Los argumentos de abrir_* son planos: todo menos usuario_id son campos del formulario. */
  const formArgs = (args: Record<string, unknown>) => {
    const rest = { ...args }
    delete rest.usuario_id
    return rest
  }
  const dialogGuard = (fill?: string) => (ctx.isDialogOpen() ? dialogAlreadyOpenError(fill) : ctx.isDeleteOpen() ? dialogAlreadyOpenError() : null)

  const parseFilters = (args: Record<string, unknown>): { filters: Partial<{ texto: string; rol: 'todos' | 'admin' | 'vendedor' }> } | { error: string } => {
    if (!('texto' in args) && !('rol' in args)) return { error: 'Indica al menos un filtro: texto o rol.' }
    const filters: Partial<{ texto: string; rol: 'todos' | 'admin' | 'vendedor' }> = {}
    if ('texto' in args) {
      if (typeof args.texto !== 'string') return { error: 'texto debe ser un texto (vacio para quitar el filtro).' }
      filters.texto = args.texto.trim().slice(0, 100)
    }
    if ('rol' in args) {
      const rol = matchOption(ROLES, args.rol)
      if (!rol) return { error: "rol debe ser 'todos', 'admin' o 'vendedor'." }
      filters.rol = rol as 'todos' | 'admin' | 'vendedor'
    }
    return { filters }
  }

  const aperturaOk = (sanitized: SanitizedUsuario, mensaje: string, extra: Record<string, unknown> = {}): ToolResult =>
    ok({
      mensaje,
      precargado: sanitized.values,
      ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
      ...(sanitized.notas.length ? { notas: sanitized.notas } : {}),
      ...credentialExtras(sanitized),
      ...extra,
    })

  return [
    {
      name: 'filtrar_usuarios',
      description: 'Filtra la lista de usuarios por texto (nombre o username) y rol (todos, admin, vendedor). Despues usa leer_usuarios.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string', description: 'Vacio para quitar el filtro.' }, rol: { type: 'string', enum: [...ROLES] } },
        additionalProperties: false,
      },
      validar: (args) => {
        const parsed = parseFilters(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const parsed = parseFilters(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters(parsed.filters)
        return ok({ filtros: { ...ctx.getFilters(), ...parsed.filters }, mensaje: 'Filtros aplicados. Usa leer_usuarios para ver el resultado.' })
      },
    },
    {
      name: 'leer_usuarios',
      description: `Lista los usuarios tras los filtros (maximo ${MAX_READ_ROWS}): id, nombre, username, rol, evidencia fotografica y si puede anular.`,
      parameters: NO_PARAMS,
      run: async () => {
        const filtrados = ctx.getFiltered()
        return ok({
          filtros: ctx.getFilters(),
          total: filtrados.length,
          mostrando: Math.min(filtrados.length, MAX_READ_ROWS),
          // Solo lo necesario para decidir: sin correo, horarios ni nada parecido a credenciales.
          usuarios: limitRows(filtrados).map((u) => ({
            id: u.id,
            nombre: nombreDe(u),
            username: u.username,
            rol: u.role ?? null,
            ...permisosActuales(u),
          })),
        })
      },
    },
    {
      name: 'abrir_nuevo_usuario',
      description:
        'Abre el formulario de nuevo usuario, opcionalmente con nombre, apellido, correo, username, rol, horario y sucursales. No guarda: el usuario escribe la contrasena y guarda.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const { errores } = sanitizeUsuarioValues(args, { sucursalIds: ctx.getSucursalIds() })
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeUsuarioValues(args, { sucursalIds: ctx.getSucursalIds() })
        ctx.openNew(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return aperturaOk(sanitized, `Formulario de nuevo usuario abierto. ${FALTA_CONTRASENA}`, { falta: FALTA_CONTRASENA })
      },
    },
    {
      name: 'abrir_editar_usuario',
      description:
        'Abre el formulario de edicion de un usuario (por id de leer_usuarios), opcionalmente con valores nuevos. No guarda: el usuario revisa y guarda.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer' }, ...FORM_PROPERTIES },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const usuario = findUsuario(args)
        if (!usuario) return NOT_FOUND
        const { errores } = sanitizeUsuarioValues(formArgs(args), { sucursalIds: ctx.getSucursalIds(), currentRole: usuario.role })
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const usuario = findUsuario(args)
        if (!usuario) return fail(NOT_FOUND)
        const sanitized = sanitizeUsuarioValues(formArgs(args), { sucursalIds: ctx.getSucursalIds(), currentRole: usuario.role })
        ctx.openEdit(usuario, Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return aperturaOk(sanitized, `Formulario de ${nombreDe(usuario)} abierto. El usuario debe revisarlo y presionar Guardar cambios.`)
      },
    },
    {
      name: 'abrir_eliminar_usuario',
      description: 'Abre la confirmacion existente para eliminar un usuario. No elimina: el usuario presiona Eliminar.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer' } },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        return findUsuario(args) ? null : NOT_FOUND
      },
      run: async (args) => {
        const usuario = findUsuario(args)
        if (!usuario) return fail(NOT_FOUND)
        ctx.openDelete(usuario)
        return ok({ mensaje: `Confirmacion para eliminar a ${nombreDe(usuario)} abierta. El usuario debe presionar Eliminar.` })
      },
    },
    {
      name: 'cambiar_permisos_usuario',
      description:
        'Cambia la evidencia fotografica y/o el permiso de anular ventas y abonos de un usuario (puede_anular no aplica a admin). Se aplica al instante: el usuario debe confirmarlo con un clic en el asistente.',
      parameters: {
        type: 'object',
        properties: {
          usuario_id: { type: 'integer' },
          evidencia_fotografica: { type: 'boolean' },
          puede_anular: { type: 'boolean' },
        },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      requiere_confirmacion: true,
      validar: (args) => {
        if (ctx.isUpdating()) return 'Ya se esta actualizando un usuario; intenta de nuevo.'
        const plan = planPermisos(args, ctx.getUsuarios())
        return 'error' in plan ? plan.error : null
      },
      // El texto sale del usuario real de la lista y de sus valores actuales, nunca del modelo.
      textoConfirmacion: (args) => {
        const plan = planPermisos(args, ctx.getUsuarios())
        if ('error' in plan) return ''
        const partes: string[] = []
        if ('evidencia_fotografica' in plan.cambios) {
          partes.push(`Evidencia fotografica: ${plan.antes.evidencia_fotografica ? 'activada' : 'desactivada'} → ${plan.cambios.evidencia_fotografica ? 'activada' : 'desactivada'}`)
        }
        if ('puede_anular' in plan.cambios) {
          partes.push(`Anular ventas y abonos: ${plan.antes.puede_anular ? 'permitido' : 'no permitido'} → ${plan.cambios.puede_anular ? 'permitido' : 'no permitido'}`)
        }
        return `Cambiar permisos de ${nombreDe(plan.usuario)} (${plan.usuario.username}): ${partes.join('; ')}`
      },
      run: async (args) => {
        const plan = planPermisos(args, ctx.getUsuarios())
        if ('error' in plan) return fail(plan.error)
        return (await ctx.updatePermisos(plan.usuario.id, plan.cambios))
          ? ok({ usuario: nombreDe(plan.usuario), aplicado: plan.cambios })
          : fail('No se pudo actualizar el permiso.')
      },
    },
  ]
}

/** Lo que UsuarioDialog le presta al agente mientras está abierto. */
export type UsuarioDialogAgentContext = {
  getRole: () => string | null
  getSucursalIds: () => readonly number[] | undefined
  /** Valores actuales SIN la contraseña (el dialogo jamás la expone). */
  getValues: () => UsuarioFormValues
  setValues: (values: Partial<UsuarioFormValues>) => void
}

/** Tool que existe mientras el diálogo de usuario está abierto. No toca la contraseña. */
export function buildUsuarioDialogTools(ctx: UsuarioDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: FILL_TOOL,
      description:
        'Llena campos del formulario de usuario abierto (nombre, apellido, correo, username, rol, horario, sucursales). No guarda ni maneja la contrasena: la escribe el usuario.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      run: async (args): Promise<ToolResult> => {
        const sanitized = sanitizeUsuarioValues(args, { sucursalIds: ctx.getSucursalIds(), currentRole: ctx.getRole() })
        const { values, errores } = sanitized
        if (Object.keys(values).length === 0) {
          return fail([...errores, ...(sanitized.credenciales.length ? [CREDENTIAL_NOTICE] : [])].join(' ') || 'No hay ningun campo valido para llenar.')
        }
        ctx.setValues(values)
        return ok({
          aplicado: values,
          ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
          ...(errores.length ? { errores } : {}),
          ...(sanitized.notas.length ? { notas: sanitized.notas } : {}),
          ...credentialExtras(sanitized),
          valores_actuales: ctx.getValues(),
          mensaje: 'Campos llenados. El usuario debe revisar el formulario, escribir la contraseña si hace falta y guardar.',
        })
      },
    },
  ]
}

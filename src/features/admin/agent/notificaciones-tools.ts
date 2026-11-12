import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import {
  CREDENTIAL_NOTICE,
  MAX_READ_ROWS,
  NO_PARAMS,
  cleanText,
  fail,
  isCredentialKey,
  limitRows,
  ok,
  positiveInt,
} from '@/features/agent/tool-helpers'
import type { ToolResult } from '@/features/agent/types'
import type { DestinatarioNotificacion, PreferenciaNotificacion } from '../notifications/types/notificaciones-types'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const MAX_HORAS = 10

// -- Programación global de cobros (HorarioCobrosSection) ---------------------------------------

export type ScheduleState = {
  /** Días del borrador (vacío = avisos pausados). */
  dias: number[]
  /** Horas del borrador (vacío = horario por defecto). */
  horas: string[]
  horasGuardadas: string[]
  /** Últimos días no vacíos, para reactivar los avisos. */
  lastDias: number[]
}

export type SchedulePlan = { dias?: number[]; horas?: string[] } | { error: string }

/**
 * Valida editar_programacion_cobros y devuelve solo lo que cambia en el borrador. Los mismos
 * límites que el formulario: días 1 a 7, horas HH:MM sin repetir.
 */
export function planCobrosSchedule(args: Record<string, unknown>, state: ScheduleState): SchedulePlan {
  if (!['activo', 'dias', 'horario', 'horas'].some((key) => key in args)) {
    return { error: 'Indica al menos un cambio: activo, dias, horario u horas.' }
  }
  const plan: { dias?: number[]; horas?: string[] } = {}

  let dias: number[] | undefined
  if ('dias' in args) {
    const raw = args.dias
    if (!Array.isArray(raw) || !raw.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) {
      return { error: 'dias debe ser una lista de numeros del 1 (lunes) al 7 (domingo).' }
    }
    dias = [...new Set(raw as number[])].sort((a, b) => a - b)
  }
  if ('activo' in args) {
    if (typeof args.activo !== 'boolean') return { error: 'activo debe ser true o false.' }
    if (args.activo === false) {
      if (dias && dias.length > 0) return { error: 'activo=false pausa los avisos: no se puede combinar con dias.' }
      dias = []
    } else if (!dias) {
      dias = state.dias.length ? state.dias : state.lastDias
    } else if (dias.length === 0) {
      return { error: 'activo=true necesita al menos un dia.' }
    }
  }
  if (dias) plan.dias = dias

  let horas: string[] | undefined
  if ('horas' in args) {
    const raw = args.horas
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_HORAS || !raw.every((h) => typeof h === 'string' && TIME_RE.test(h))) {
      return { error: `horas debe ser una lista de 1 a ${MAX_HORAS} horas HH:MM (00:00 a 23:59).` }
    }
    if (new Set(raw).size !== raw.length) return { error: 'horas no puede repetir horarios.' }
    horas = [...raw]
  }
  if ('horario' in args) {
    if (args.horario !== 'default' && args.horario !== 'custom') return { error: "horario debe ser 'default' o 'custom'." }
    if (args.horario === 'default') {
      if (horas) return { error: "horario 'default' usa el horario por defecto: no se puede combinar con horas." }
      horas = []
    } else if (!horas) {
      const existentes = state.horas.length ? state.horas : state.horasGuardadas
      if (existentes.length === 0) return { error: "horario 'custom' necesita horas (HH:MM)." }
      horas = [...existentes]
    }
  }
  if (horas) plan.horas = horas
  return plan
}

/** Lo que HorarioCobrosSection le presta al agente (solo con la configuración ya cargada). */
export type ScheduleAgentContext = {
  getState: () => ScheduleState & {
    diasGuardados: number[]
    hasChanges: boolean
    valid: boolean
    zonaHoraria: string
    ultimoEnvio: string | null
  }
  /** Escribe en el borrador (no guarda). */
  apply: (plan: { dias?: number[]; horas?: string[] }) => void
}

const DIAS_NOMBRE = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const describeDias = (dias: number[]) => (dias.length === 7 ? 'todos los dias' : dias.map((d) => DIAS_NOMBRE[d - 1]).join(', '))

/** Tools de la programación global de cobros. Solo modifican el borrador: el usuario presiona Guardar programación. */
export function buildCobrosScheduleTools(ctx: ScheduleAgentContext): AgentToolDef[] {
  const describe = () => {
    const s = ctx.getState()
    return {
      activo: s.dias.length > 0,
      dias: s.dias,
      dias_texto: s.dias.length ? describeDias(s.dias) : 'avisos pausados',
      horario: s.horas.length === 0 ? 'default' : 'custom',
      horas: s.horas,
      guardado: { dias: s.diasGuardados, horas: s.horasGuardadas },
      cambios_sin_guardar: s.hasChanges,
      valida: s.valid,
      zona_horaria: s.zonaHoraria,
      ultimo_envio: s.ultimoEnvio,
    }
  }

  return [
    {
      name: 'leer_programacion_cobros',
      description: 'Lee la programacion global de avisos de cobros (borrador incluido): dias, horario, horas, zona horaria y ultimo envio.',
      parameters: NO_PARAMS,
      run: async () => ok(describe()),
    },
    {
      name: 'editar_programacion_cobros',
      description:
        'Cambia en el BORRADOR la programacion global de cobros: activo, dias (1 lunes ... 7 domingo), horario (default|custom) y horas HH:MM. No guarda: el usuario debe presionar Guardar programacion.',
      parameters: {
        type: 'object',
        properties: {
          activo: { type: 'boolean', description: 'false pausa los avisos; true los reactiva.' },
          dias: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 7 } },
          horario: { type: 'string', enum: ['default', 'custom'] },
          horas: { type: 'array', maxItems: MAX_HORAS, items: { type: 'string' }, description: 'HH:MM sin repetir.' },
        },
        additionalProperties: false,
      },
      validar: (args) => {
        const plan = planCobrosSchedule(args, ctx.getState())
        return 'error' in plan ? plan.error : null
      },
      run: async (args) => {
        const plan = planCobrosSchedule(args, ctx.getState())
        if ('error' in plan) return fail(plan.error)
        ctx.apply(plan)
        const result = describe()
        return ok({
          ...result,
          mensaje: result.valida
            ? 'Solo se modifico el borrador. Presiona Guardar programacion para aplicar.'
            : 'Borrador con horarios incompletos: revisalos. Presiona Guardar programacion cuando este completo.',
        })
      },
    },
  ]
}

// -- Destinatarios (NotificacionesPage) ---------------------------------------------------------

const PREFERENCIAS: ReadonlyArray<PreferenciaNotificacion> = [
  'recibir_stock_bajo',
  'recibir_abonos',
  'recibir_clientes_deudas',
  'recibir_ventas_realizadas',
]

export type DestinatarioFormValues = {
  nombre: string
  email: string
} & Partial<Record<PreferenciaNotificacion, boolean>>

export type SanitizedDestinatario = {
  values: DestinatarioFormValues | Partial<DestinatarioFormValues>
  ignorados: string[]
  credenciales: string[]
  errores: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida nombre, correo (formato) y preferencias del formulario de destinatario. */
export function sanitizeDestinatarioValues(raw: unknown): SanitizedDestinatario {
  const result: SanitizedDestinatario = { values: {}, ignorados: [], credenciales: [], errores: [] }
  if (raw === undefined || raw === null) return result
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos del destinatario.')
    return result
  }
  const values: Partial<DestinatarioFormValues> = result.values
  for (const [key, value] of Object.entries(raw)) {
    if (isCredentialKey(key)) {
      result.credenciales.push(key)
      continue
    }
    if ((PREFERENCIAS as readonly string[]).includes(key)) {
      if (typeof value !== 'boolean') result.errores.push(`${key} debe ser true o false.`)
      else values[key as PreferenciaNotificacion] = value
      continue
    }
    switch (key) {
      case 'nombre': {
        const nombre = cleanText(value, 150)
        if (nombre === null) result.errores.push('nombre debe ser un texto no vacio.')
        else values.nombre = nombre
        break
      }
      case 'email': {
        const email = typeof value === 'string' ? value.trim() : ''
        if (!EMAIL_RE.test(email) || email.length > 254) result.errores.push('email debe ser un correo valido (nombre@dominio.com).')
        else values.email = email
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

const credentialExtras = (s: SanitizedDestinatario) => (s.credenciales.length ? { credenciales_descartadas: s.credenciales, aviso: CREDENTIAL_NOTICE } : {})

/** Lo que NotificacionesPage le presta al agente: la PÁGINA visible de destinatarios y sus borradores. */
export type DestinatariosAgentContext = {
  /** Destinatarios de la página visible, con el borrador de preferencias aplicado. */
  getVisible: () => DestinatarioNotificacion[]
  getTotal: () => number
  getPage: () => { page: number; totalPages: number }
  getTexto: () => string
  setTexto: (texto: string) => void
  isLoading: () => boolean
  /** Hay preferencias editadas sin guardar. */
  hasUnsavedChanges: () => boolean
  /** Cambia preferencias en el borrador (no guarda). */
  setPreferencias: (id: number, cambios: Partial<Record<PreferenciaNotificacion, boolean>>) => void
  /** El diálogo de nuevo destinatario está abierto. */
  isDialogOpen: () => boolean
  isDeleteOpen: () => boolean
  openNew: (valores?: DestinatarioFormValues | Partial<DestinatarioFormValues>) => void
  openDelete: (destinatario: DestinatarioNotificacion) => void
}

const FILL_TOOL = 'llenar_formulario_destinatario'
const PREF_PROPS = Object.fromEntries(PREFERENCIAS.map((key) => [key, { type: 'boolean' }]))
const FORM_PROPERTIES = {
  nombre: { type: 'string', description: 'Nombre o cargo.' },
  email: { type: 'string', description: 'Correo valido.' },
  ...PREF_PROPS,
}

/** Tools de los destinatarios. Las preferencias solo modifican el borrador: el usuario presiona Guardar preferencias. */
export function buildDestinatariosTools(ctx: DestinatariosAgentContext): AgentToolDef[] {
  const visible = (args: Record<string, unknown>) => {
    const id = positiveInt(args.destinatario_id)
    return id === null ? undefined : ctx.getVisible().find((d) => d.id === id)
  }
  const NOT_VISIBLE =
    'Ese destinatario no esta en la pagina visible (Guardar preferencias solo envia esa pagina): usa filtrar_destinatarios para encontrarlo primero (ver leer_notificaciones).'
  const dialogGuard = (fill?: string) => (ctx.isDialogOpen() ? dialogAlreadyOpenError(fill) : ctx.isDeleteOpen() ? dialogAlreadyOpenError() : null)

  const parsePrefs = (
    args: Record<string, unknown>,
  ): { error: string } | { cambios: Partial<Record<PreferenciaNotificacion, boolean>> } => {
    const cambios: Partial<Record<PreferenciaNotificacion, boolean>> = {}
    for (const key of PREFERENCIAS) {
      if (!(key in args)) continue
      const value = args[key]
      if (typeof value !== 'boolean') return { error: `${key} debe ser true o false.` }
      cambios[key] = value
    }
    if (Object.keys(cambios).length === 0) return { error: `Indica al menos una preferencia: ${PREFERENCIAS.join(', ')}.` }
    return { cambios }
  }

  return [
    {
      name: 'leer_notificaciones',
      description: `Lee los destinatarios de la pagina visible (maximo ${MAX_READ_ROWS}) con sus preferencias (borrador incluido), la pagina y si hay cambios sin guardar.`,
      parameters: NO_PARAMS,
      run: async () => {
        const lista = ctx.getVisible()
        const { page, totalPages } = ctx.getPage()
        return ok({
          texto: ctx.getTexto(),
          cargando: ctx.isLoading(),
          total: ctx.getTotal(),
          pagina: page,
          paginas: totalPages,
          cambios_sin_guardar: ctx.hasUnsavedChanges(),
          destinatarios: limitRows(lista).map((d) => ({
            id: d.id,
            nombre: d.nombre_persona_email,
            email: d.email,
            recibir_stock_bajo: d.recibir_stock_bajo,
            recibir_abonos: d.recibir_abonos,
            recibir_clientes_deudas: d.recibir_clientes_deudas,
            recibir_ventas_realizadas: d.recibir_ventas_realizadas,
          })),
        })
      },
    },
    {
      name: 'filtrar_destinatarios',
      description:
        'Busca destinatarios por nombre o correo (texto vacio quita el filtro). Falla si hay preferencias sin guardar, porque cambiar la lista las descartaria.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string' } },
        required: ['texto'],
        additionalProperties: false,
      },
      validar: (args) => {
        if (typeof args.texto !== 'string') return 'texto debe ser un texto (vacio para quitar el filtro).'
        return ctx.hasUnsavedChanges()
          ? 'Hay preferencias sin guardar: cambiar la busqueda las descartaria. El usuario debe presionar Guardar preferencias (o Descartar) primero.'
          : null
      },
      run: async (args) => {
        const texto = String(args.texto).trim().slice(0, 100)
        ctx.setTexto(texto)
        return ok({ texto, mensaje: 'Busqueda aplicada (puede tardar un instante). Usa leer_notificaciones para ver el resultado.' })
      },
    },
    {
      name: 'cambiar_preferencias_destinatario',
      description:
        'Cambia en el BORRADOR las preferencias de un destinatario de la pagina visible (recibir_stock_bajo, recibir_abonos, recibir_clientes_deudas, recibir_ventas_realizadas). No guarda: el usuario debe presionar Guardar preferencias.',
      parameters: {
        type: 'object',
        properties: { destinatario_id: { type: 'integer' }, ...PREF_PROPS },
        required: ['destinatario_id'],
        additionalProperties: false,
      },
      validar: (args) => {
        if (!visible(args)) return NOT_VISIBLE
        const parsed = parsePrefs(args)
        return 'error' in parsed ? parsed.error : null
      },
      run: async (args) => {
        const destinatario = visible(args)
        if (!destinatario) return fail(NOT_VISIBLE)
        const parsed = parsePrefs(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setPreferencias(destinatario.id, parsed.cambios)
        return ok({
          destinatario: destinatario.nombre_persona_email,
          aplicado: parsed.cambios,
          mensaje: 'Solo se modifico el borrador. Presiona Guardar preferencias para aplicar.',
        })
      },
    },
    {
      name: 'abrir_nuevo_destinatario',
      description:
        'Abre el formulario de nuevo destinatario, opcionalmente con nombre, correo y preferencias. No guarda: el usuario presiona Guardar destinatario.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const { errores } = sanitizeDestinatarioValues(args)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeDestinatarioValues(args)
        ctx.openNew(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return ok({
          mensaje: 'Formulario de nuevo destinatario abierto. El usuario debe revisarlo y presionar Guardar destinatario.',
          precargado: sanitized.values,
          ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
          ...credentialExtras(sanitized),
        })
      },
    },
    {
      name: 'abrir_eliminar_destinatario',
      description:
        'Abre la confirmacion existente para eliminar un destinatario de la pagina visible. No elimina: el usuario presiona Eliminar destinatario.',
      parameters: {
        type: 'object',
        properties: { destinatario_id: { type: 'integer' } },
        required: ['destinatario_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        return visible(args) ? null : NOT_VISIBLE
      },
      run: async (args) => {
        const destinatario = visible(args)
        if (!destinatario) return fail(NOT_VISIBLE)
        ctx.openDelete(destinatario)
        return ok({ mensaje: `Confirmacion para eliminar a ${destinatario.nombre_persona_email} abierta. El usuario debe presionar Eliminar destinatario.` })
      },
    },
  ]
}

/** Lo que el diálogo de nuevo destinatario le presta al agente mientras está abierto. */
export type DestinatarioDialogAgentContext = {
  getValues: () => DestinatarioFormValues
  setValues: (values: Partial<DestinatarioFormValues>) => void
}

/** Tool que existe mientras el diálogo de destinatario está abierto. */
export function buildDestinatarioDialogTools(ctx: DestinatarioDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: FILL_TOOL,
      description: 'Llena nombre, correo (valida el formato) y preferencias del formulario de destinatario abierto. No guarda: el usuario presiona el boton.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      run: async (args): Promise<ToolResult> => {
        const sanitized = sanitizeDestinatarioValues(args)
        if (Object.keys(sanitized.values).length === 0) {
          return fail(sanitized.errores.length ? sanitized.errores.join(' ') : 'No hay ningun campo valido para llenar.')
        }
        ctx.setValues(sanitized.values)
        return ok({
          aplicado: sanitized.values,
          ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
          ...(sanitized.errores.length ? { errores: sanitized.errores } : {}),
          ...credentialExtras(sanitized),
          valores_actuales: ctx.getValues(),
          mensaje: 'Campos llenados. El usuario debe revisar y presionar Guardar destinatario.',
        })
      },
    },
  ]
}

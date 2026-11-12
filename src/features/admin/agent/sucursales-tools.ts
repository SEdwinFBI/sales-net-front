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
import type { Sucursal } from '../branches/types/sucursal-types'

export type SucursalFormValues = { nombre: string; direccion: string; telefono: string }

export type SanitizedSucursal = {
  values: Partial<SucursalFormValues>
  ignorados: string[]
  credenciales: string[]
  errores: string[]
}

/** Valida nombre, dirección y teléfono de una sucursal. Dirección y teléfono pueden quedar vacíos. */
export function sanitizeSucursalValues(raw: unknown): SanitizedSucursal {
  const result: SanitizedSucursal = { values: {}, ignorados: [], credenciales: [], errores: [] }
  if (raw === undefined || raw === null) return result
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    result.errores.push('Los valores deben ser un objeto con los campos de la sucursal.')
    return result
  }

  for (const [key, value] of Object.entries(raw)) {
    if (isCredentialKey(key)) {
      result.credenciales.push(key)
      continue
    }
    switch (key) {
      case 'nombre': {
        const nombre = cleanText(value, 150)
        if (nombre === null) result.errores.push('nombre debe ser un texto no vacio.')
        else result.values.nombre = nombre
        break
      }
      case 'direccion':
        if (typeof value !== 'string') result.errores.push('direccion debe ser un texto (vacio para dejarla sin direccion).')
        else result.values.direccion = value.trim().slice(0, 250)
        break
      case 'telefono': {
        const phone = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? String(value) : typeof value === 'string' ? value.trim().slice(0, 30) : null
        if (phone === null) result.errores.push('telefono debe ser un texto o numero (vacio para dejarlo sin telefono).')
        else result.values.telefono = phone
        break
      }
      default:
        result.ignorados.push(key)
    }
  }
  return result
}

const credentialExtras = (s: SanitizedSucursal) => (s.credenciales.length ? { credenciales_descartadas: s.credenciales, aviso: CREDENTIAL_NOTICE } : {})

/** Lo que SucursalesTable le presta al agente. */
export type SucursalesAgentContext = {
  getSucursales: () => Sucursal[]
  getFiltered: () => Sucursal[]
  getTexto: () => string
  setTexto: (texto: string) => void
  isLoading: () => boolean
  /** El formulario de sucursal (nueva o edición) está abierto. */
  isDialogOpen: () => boolean
  isDeleteOpen: () => boolean
  openNew: (valores?: Partial<SucursalFormValues>) => void
  openEdit: (sucursal: Sucursal, valores?: Partial<SucursalFormValues>) => void
  openDeactivate: (sucursal: Sucursal) => void
  /** Navega a /administracion/sucursales/<id> (el botón «Ver equipo»). */
  goToEquipo: (sucursalId: number) => void
}

const FILL_TOOL = 'llenar_formulario_sucursal'
const FORM_PROPERTIES = {
  nombre: { type: 'string' },
  direccion: { type: 'string' },
  telefono: { type: 'string' },
} as const

/** Tools de /administracion/sucursales. */
export function buildSucursalesTools(ctx: SucursalesAgentContext): AgentToolDef[] {
  const find = (args: Record<string, unknown>) => {
    const id = positiveInt(args.sucursal_id)
    return id === null ? undefined : ctx.getSucursales().find((s) => s.id === id)
  }
  const NOT_FOUND = 'No encontre esa sucursal (ver leer_sucursales).'
  const formArgs = (args: Record<string, unknown>) => {
    const rest = { ...args }
    delete rest.sucursal_id
    return rest
  }
  const dialogGuard = (fill?: string) => (ctx.isDialogOpen() ? dialogAlreadyOpenError(fill) : ctx.isDeleteOpen() ? dialogAlreadyOpenError() : null)
  const aperturaOk = (sanitized: SanitizedSucursal, mensaje: string): ToolResult =>
    ok({
      mensaje,
      precargado: sanitized.values,
      ...(sanitized.ignorados.length ? { campos_no_permitidos: sanitized.ignorados } : {}),
      ...credentialExtras(sanitized),
    })

  return [
    {
      name: 'filtrar_sucursales',
      description: 'Filtra las sucursales por texto (nombre o direccion). Texto vacio quita el filtro. Despues usa leer_sucursales.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string' } },
        required: ['texto'],
        additionalProperties: false,
      },
      validar: (args) => (typeof args.texto === 'string' ? null : 'texto debe ser un texto (vacio para quitar el filtro).'),
      run: async (args) => {
        const texto = String(args.texto).trim().slice(0, 100)
        ctx.setTexto(texto)
        return ok({ texto, mensaje: 'Filtro aplicado. Usa leer_sucursales para ver el resultado.' })
      },
    },
    {
      name: 'leer_sucursales',
      description: `Lista las sucursales tras el filtro (maximo ${MAX_READ_ROWS}): id, nombre, direccion, telefono, si esta activa y cuantos usuarios tiene.`,
      parameters: NO_PARAMS,
      run: async () => {
        const filtradas = ctx.getFiltered()
        return ok({
          texto: ctx.getTexto(),
          cargando: ctx.isLoading(),
          total: ctx.getSucursales().length,
          coinciden: filtradas.length,
          sucursales: limitRows(filtradas).map((s) => ({
            id: s.id,
            nombre: s.nombre,
            direccion: s.direccion,
            telefono: s.telefono,
            activa: s.activo,
            usuarios: s.usuarios_count ?? 0,
          })),
        })
      },
    },
    {
      name: 'abrir_nueva_sucursal',
      description: 'Abre el formulario de nueva sucursal, opcionalmente con nombre, direccion y telefono. No guarda: el usuario presiona Crear sucursal.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        const { errores } = sanitizeSucursalValues(args)
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sanitized = sanitizeSucursalValues(args)
        ctx.openNew(Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return aperturaOk(sanitized, 'Formulario de nueva sucursal abierto. El usuario debe revisarlo y presionar Crear sucursal.')
      },
    },
    {
      name: 'abrir_editar_sucursal',
      description: 'Abre el formulario de edicion de una sucursal (por id de leer_sucursales), opcionalmente con valores nuevos. No guarda: el usuario presiona Guardar cambios.',
      parameters: {
        type: 'object',
        properties: { sucursal_id: { type: 'integer' }, ...FORM_PROPERTIES },
        required: ['sucursal_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        const guard = dialogGuard(FILL_TOOL)
        if (guard) return guard
        if (!find(args)) return NOT_FOUND
        const { errores } = sanitizeSucursalValues(formArgs(args))
        return errores.length ? errores.join(' ') : null
      },
      run: async (args) => {
        const sucursal = find(args)
        if (!sucursal) return fail(NOT_FOUND)
        const sanitized = sanitizeSucursalValues(formArgs(args))
        ctx.openEdit(sucursal, Object.keys(sanitized.values).length ? sanitized.values : undefined)
        return aperturaOk(sanitized, `Formulario de ${sucursal.nombre} abierto. El usuario debe revisarlo y presionar Guardar cambios.`)
      },
    },
    {
      name: 'abrir_desactivar_sucursal',
      description: 'Abre la confirmacion existente para desactivar una sucursal (se conservan inventario, ventas y precios). No desactiva: el usuario presiona Desactivar.',
      parameters: {
        type: 'object',
        properties: { sucursal_id: { type: 'integer' } },
        required: ['sucursal_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        const sucursal = find(args)
        if (!sucursal) return NOT_FOUND
        return sucursal.activo ? null : `${sucursal.nombre} ya esta inactiva.`
      },
      run: async (args) => {
        const sucursal = find(args)
        if (!sucursal) return fail(NOT_FOUND)
        ctx.openDeactivate(sucursal)
        return ok({ mensaje: `Confirmacion para desactivar ${sucursal.nombre} abierta. El usuario debe presionar Desactivar.` })
      },
    },
    {
      name: 'ver_equipo_sucursal',
      description: 'Abre el equipo (usuarios asignados) de una sucursal de la lista. Despues se registran las herramientas del equipo.',
      parameters: {
        type: 'object',
        properties: { sucursal_id: { type: 'integer' } },
        required: ['sucursal_id'],
        additionalProperties: false,
      },
      abreUi: true,
      validar: (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return dialogAlreadyOpenError()
        return find(args) ? null : NOT_FOUND
      },
      run: async (args) => {
        const sucursal = find(args)
        if (!sucursal) return fail(NOT_FOUND)
        ctx.goToEquipo(sucursal.id)
        return ok({ mensaje: `Abriendo el equipo de ${sucursal.nombre}.` })
      },
    },
  ]
}

/** Lo que SucursalDialog le presta al agente mientras está abierto. */
export type SucursalDialogAgentContext = {
  getValues: () => SucursalFormValues
  setValues: (values: Partial<SucursalFormValues>) => void
}

/** Tool que existe mientras el diálogo de sucursal está abierto. */
export function buildSucursalDialogTools(ctx: SucursalDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: FILL_TOOL,
      description: 'Llena nombre, direccion y telefono del formulario de sucursal abierto. No guarda: el usuario presiona el boton.',
      parameters: { type: 'object', properties: { ...FORM_PROPERTIES }, additionalProperties: false },
      run: async (args): Promise<ToolResult> => {
        const sanitized = sanitizeSucursalValues(args)
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
          mensaje: 'Campos llenados. El usuario debe revisar y presionar el boton para guardar.',
        })
      },
    },
  ]
}

// -- Equipo de una sucursal (/administracion/sucursales/:id) -------------------------------------

export type EquipoMember = { id: number; username: string; full_name: string }

/** Lo que SucursalDetallePage le presta al agente. */
export type EquipoAgentContext = {
  getSucursal: () => { id: number; nombre: string; activo: boolean } | undefined
  getAsignados: () => EquipoMember[]
  /** Asignados tras el filtro de búsqueda. */
  getFiltrados: () => EquipoMember[]
  /** Vendedores que aún no están asignados (las opciones reales del selector «Agregar»). */
  getDisponibles: () => { id: number; nombre: string }[]
  getTexto: () => string
  setTexto: (texto: string) => void
  isLoading: () => boolean
  isBusy: () => boolean
  /** Mismo flujo que el botón «Agregar»; true si salió bien (el error ya se muestra). */
  agregar: (usuarioId: number) => Promise<boolean>
  /** Mismo flujo que el botón «Quitar»; true si salió bien. */
  quitar: (usuarioId: number) => Promise<boolean>
}

/** Tools del equipo de una sucursal. Agregar y quitar piden confirmación (en la UI se ejecutan al instante). */
export function buildEquipoTools(ctx: EquipoAgentContext): AgentToolDef[] {
  const sucursalNombre = () => ctx.getSucursal()?.nombre ?? 'la sucursal'
  const disponible = (args: Record<string, unknown>) => {
    const id = positiveInt(args.usuario_id)
    return id === null ? undefined : ctx.getDisponibles().find((u) => u.id === id)
  }
  const asignado = (args: Record<string, unknown>) => {
    const id = positiveInt(args.usuario_id)
    return id === null ? undefined : ctx.getAsignados().find((u) => u.id === id)
  }

  return [
    {
      name: 'leer_equipo',
      description: `Lee el equipo de la sucursal (maximo ${MAX_READ_ROWS}): usuarios asignados y vendedores que se pueden agregar, con sus ids.`,
      parameters: NO_PARAMS,
      run: async () => {
        const sucursal = ctx.getSucursal()
        if (!sucursal) return fail(ctx.isLoading() ? 'El equipo aun esta cargando; intenta de nuevo.' : 'No hay datos de la sucursal.')
        const asignados = ctx.getAsignados()
        return ok({
          sucursal: sucursal.nombre,
          activa: sucursal.activo,
          filtro: ctx.getTexto(),
          total_asignados: asignados.length,
          coinciden: ctx.getFiltrados().length,
          asignados: limitRows(ctx.getFiltrados()).map((u) => ({ id: u.id, nombre: u.full_name, username: u.username })),
          vendedores_disponibles: limitRows(ctx.getDisponibles()),
        })
      },
    },
    {
      name: 'filtrar_equipo',
      description: 'Filtra el equipo de la sucursal por nombre o username. Texto vacio quita el filtro. Despues usa leer_equipo.',
      parameters: {
        type: 'object',
        properties: { texto: { type: 'string' } },
        required: ['texto'],
        additionalProperties: false,
      },
      validar: (args) => (typeof args.texto === 'string' ? null : 'texto debe ser un texto (vacio para quitar el filtro).'),
      run: async (args) => {
        const texto = String(args.texto).trim().slice(0, 100)
        ctx.setTexto(texto)
        return ok({ texto, mensaje: 'Filtro aplicado.' })
      },
    },
    {
      name: 'agregar_vendedor_sucursal',
      description:
        'Agrega un vendedor (aun no asignado) al equipo de la sucursal. Se aplica al instante: el usuario debe confirmarlo con un clic en el asistente.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer', description: 'id de vendedores_disponibles en leer_equipo.' } },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      requiere_confirmacion: true,
      validar: (args) => {
        if (ctx.isBusy()) return 'Ya hay un cambio de equipo en curso; intenta de nuevo.'
        if (disponible(args)) return null
        const yaAsignado = asignado(args)
        return yaAsignado
          ? `${yaAsignado.full_name} ya pertenece al equipo de ${sucursalNombre()}.`
          : 'Ese usuario no es un vendedor disponible para esta sucursal: solo se pueden agregar vendedores aun no asignados (ver leer_equipo).'
      },
      // El texto sale del vendedor y la sucursal reales, nunca de lo que diga el modelo.
      textoConfirmacion: (args) => {
        const vendedor = disponible(args)
        return vendedor ? `Agregar a ${vendedor.nombre} al equipo de ${sucursalNombre()}` : ''
      },
      run: async (args) => {
        const vendedor = disponible(args)
        if (!vendedor) return fail('Ese vendedor ya no esta disponible.')
        return (await ctx.agregar(vendedor.id)) ? ok({ agregado: vendedor.nombre, sucursal: sucursalNombre() }) : fail('No se pudo agregar al vendedor.')
      },
    },
    {
      name: 'quitar_vendedor_sucursal',
      description:
        'Quita a un miembro actual del equipo de la sucursal (sus otras sucursales no cambian). Se aplica al instante: el usuario debe confirmarlo con un clic en el asistente.',
      parameters: {
        type: 'object',
        properties: { usuario_id: { type: 'integer', description: 'id de asignados en leer_equipo.' } },
        required: ['usuario_id'],
        additionalProperties: false,
      },
      requiere_confirmacion: true,
      validar: (args) => {
        if (ctx.isBusy()) return 'Ya hay un cambio de equipo en curso; intenta de nuevo.'
        return asignado(args) ? null : 'Ese usuario no es miembro actual del equipo de esta sucursal (ver leer_equipo).'
      },
      textoConfirmacion: (args) => {
        const miembro = asignado(args)
        return miembro ? `Quitar a ${miembro.full_name} (${miembro.username}) del equipo de ${sucursalNombre()}: perdera el acceso a esta sucursal` : ''
      },
      run: async (args) => {
        const miembro = asignado(args)
        if (!miembro) return fail('Ese usuario ya no esta en el equipo.')
        return (await ctx.quitar(miembro.id)) ? ok({ quitado: miembro.full_name, sucursal: sucursalNombre() }) : fail('No se pudo quitar al usuario.')
      },
    },
  ]
}

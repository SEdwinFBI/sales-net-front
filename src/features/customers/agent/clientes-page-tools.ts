import { dialogAlreadyOpenError, type AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { ToolResult } from '@/features/agent/types'
import type { Cliente } from '../types/clientes'
import { CLIENTE_FORM_PARAMETERS } from './cliente-dialog-tools'
import { sanitizeClienteValues, type ClienteFormValues } from './cliente-form-values'

export type CreditoFiltro = 'todos' | 'con' | 'sin'
export type EstadoFiltro = 'todos' | 'activo' | 'inactivo'
export type ClientesFilters = { texto: string; credito: CreditoFiltro; estado: EstadoFiltro }

/** Lo que ClientesPage le presta al agente: sus filtros, su lista cargada y sus diálogos. */
export type ClientesPageAgentContext = {
  readFilters: () => ClientesFilters
  /** Datos ya cargados por react-query (sin peticiones nuevas). */
  readList: () => { clientes: Cliente[]; total: number; cargando: boolean }
  setFilters: (filters: Partial<ClientesFilters>) => void
  /** El formulario de cliente (nuevo o edición) está abierto. */
  isDialogOpen: () => boolean
  /** La confirmación de eliminar está abierta. */
  isDeleteOpen: () => boolean
  openNew: (valores?: Partial<ClienteFormValues>) => void
  openEdit: (cliente: Cliente, valores?: Partial<ClienteFormValues>) => void
  openDelete: (cliente: Cliente) => void
  fetchCliente: (id: number) => Promise<Cliente>
}

/** Máximo de filas que `leer_clientes` devuelve al modelo. */
export const MAX_ROWS = 30

const CREDITO_VALUES: ReadonlyArray<CreditoFiltro> = ['todos', 'con', 'sin']
const ESTADO_VALUES: ReadonlyArray<EstadoFiltro> = ['todos', 'activo', 'inactivo']

type Args = Record<string, unknown>
const fail = (error: string): ToolResult => ({ ok: false, error })
const ok = (data: unknown): ToolResult => ({ ok: true, data })

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

export function parseFilterArgs(args: Args): { filters: Partial<ClientesFilters> } | { error: string } {
  const filters: Partial<ClientesFilters> = {}
  if ('texto' in args) {
    if (typeof args.texto !== 'string') return { error: 'texto debe ser un texto (vacio para quitar el filtro).' }
    filters.texto = args.texto.trim().slice(0, 100)
  }
  if ('credito' in args) {
    if (!CREDITO_VALUES.includes(args.credito as CreditoFiltro)) return { error: "credito debe ser 'todos', 'con' o 'sin'." }
    filters.credito = args.credito as CreditoFiltro
  }
  if ('estado' in args) {
    if (!ESTADO_VALUES.includes(args.estado as EstadoFiltro)) return { error: "estado debe ser 'todos', 'activo' o 'inactivo'." }
    filters.estado = args.estado as EstadoFiltro
  }
  if (Object.keys(filters).length === 0) return { error: 'Indica al menos un filtro: texto, credito o estado.' }
  return { filters }
}

const FILL_TOOL = 'llenar_formulario_cliente'
const VALORES_SCHEMA = { ...CLIENTE_FORM_PARAMETERS, description: 'Campos del formulario a precargar.' }

/**
 * Tools de /clientes/listado. Las de lectura y filtros las ve cualquier rol; las que abren
 * formularios o la confirmación de eliminar, solo el admin (igual que los botones de la UI).
 * Ninguna guarda ni elimina: abren el diálogo y el usuario presiona el botón.
 */
export function buildClientesPageTools(ctx: ClientesPageAgentContext, isAdmin: boolean): AgentToolDef[] {
  /** Busca el cliente entre los cargados; si la página actual no lo tiene, lo pide por id. */
  const findCliente = async (id: number): Promise<Cliente | null> => {
    const loaded = ctx.readList().clientes.find((c) => c.id === id)
    if (loaded) return loaded
    try {
      return await ctx.fetchCliente(id)
    } catch {
      return null
    }
  }

  const tools: AgentToolDef[] = [
    {
      name: 'filtrar_clientes',
      description:
        'Filtra la lista de clientes por texto (nombre o telefono), credito (todos/con/sin) y estado (todos/activo/inactivo). Despues usa leer_clientes.',
      parameters: {
        type: 'object',
        properties: {
          texto: { type: 'string', description: 'Vacio para quitar el filtro de texto.' },
          credito: { type: 'string', enum: [...CREDITO_VALUES] },
          estado: { type: 'string', enum: [...ESTADO_VALUES] },
        },
        additionalProperties: false,
      },
      run: async (args) => {
        const parsed = parseFilterArgs(args)
        if ('error' in parsed) return fail(parsed.error)
        ctx.setFilters(parsed.filters)
        return ok({
          filtros: { ...ctx.readFilters(), ...parsed.filters },
          mensaje: 'Filtros aplicados. Usa leer_clientes para ver el resultado.',
        })
      },
    },
    {
      name: 'leer_clientes',
      description: `Devuelve los clientes de la pagina cargada (maximo ${MAX_ROWS}): id, nombre, telefono, direccion, credito, balance y estado, mas el total y los filtros.`,
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      run: async () => {
        const { clientes, total, cargando } = ctx.readList()
        return ok({
          filtros: ctx.readFilters(),
          total,
          mostrando: Math.min(clientes.length, MAX_ROWS),
          cargando,
          clientes: clientes.slice(0, MAX_ROWS).map((c) => ({
            id: c.id,
            nombre: c.nombre_completo,
            telefono: c.telefono,
            direccion: c.direccion,
            credito: c.permitir_credito,
            balance: Number(c.balance),
            activo: c.activo,
          })),
        })
      },
    },
  ]

  if (!isAdmin) return tools

  tools.push(
    {
      name: 'abrir_nuevo_cliente',
      description:
        'Abre el formulario de nuevo cliente, opcionalmente precargado con valores. No guarda: el usuario revisa y presiona Crear cliente.',
      parameters: {
        type: 'object',
        properties: { valores: VALORES_SCHEMA },
        additionalProperties: false,
      },
      abreUi: true,
      run: async (args) => {
        // Con el formulario ya abierto, los valores nuevos se ignorarían en silencio (el reset solo corre al abrir).
        if (ctx.isDialogOpen()) return fail(dialogAlreadyOpenError(FILL_TOOL))
        if (ctx.isDeleteOpen()) return fail(dialogAlreadyOpenError())
        const { values, ignorados, errores, notas } = sanitizeClienteValues(args.valores)
        if (errores.length) return fail(errores.join(' '))
        ctx.openNew(Object.keys(values).length ? values : undefined)
        return ok({
          mensaje: 'Formulario abierto. El usuario debe revisarlo y presionar Crear cliente.',
          precargado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
          ...(notas.length ? { notas } : {}),
        })
      },
    },
    {
      name: 'abrir_editar_cliente',
      description:
        'Abre el formulario de edicion de un cliente (por id de leer_clientes o buscar_cliente), opcionalmente con valores nuevos precargados. No guarda.',
      parameters: {
        type: 'object',
        properties: { cliente_id: { type: 'integer' }, valores: VALORES_SCHEMA },
        required: ['cliente_id'],
        additionalProperties: false,
      },
      abreUi: true,
      run: async (args) => {
        if (ctx.isDialogOpen()) return fail(dialogAlreadyOpenError(FILL_TOOL))
        if (ctx.isDeleteOpen()) return fail(dialogAlreadyOpenError())
        const id = positiveInt(args.cliente_id)
        if (!id) return fail('cliente_id debe ser un entero positivo.')
        const cliente = await findCliente(id)
        if (!cliente) return fail('No encontre ese cliente.')

        const { values, ignorados, errores, notas } = sanitizeClienteValues(args.valores, {
          creditoBloqueado: Number(cliente.balance) !== 0,
        })
        if (errores.length) return fail(errores.join(' '))
        ctx.openEdit(cliente, Object.keys(values).length ? values : undefined)
        return ok({
          mensaje: `Formulario de ${cliente.nombre_completo} abierto. El usuario debe revisarlo y presionar Guardar cambios.`,
          precargado: values,
          ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
          ...(notas.length ? { notas } : {}),
        })
      },
    },
    {
      name: 'abrir_eliminar_cliente',
      description:
        'Abre la confirmacion para eliminar (dejar inactivo) a un cliente. No elimina: el usuario presiona Eliminar.',
      parameters: {
        type: 'object',
        properties: { cliente_id: { type: 'integer' } },
        required: ['cliente_id'],
        additionalProperties: false,
      },
      abreUi: true,
      run: async (args) => {
        if (ctx.isDialogOpen() || ctx.isDeleteOpen()) return fail(dialogAlreadyOpenError())
        const id = positiveInt(args.cliente_id)
        if (!id) return fail('cliente_id debe ser un entero positivo.')
        const cliente = await findCliente(id)
        if (!cliente) return fail('No encontre ese cliente.')
        ctx.openDelete(cliente)
        return ok({
          mensaje: `Confirmacion abierta para eliminar a ${cliente.nombre_completo}. El usuario debe presionar Eliminar.`,
        })
      },
    },
  )

  return tools
}

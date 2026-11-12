import { create } from 'zustand'
import type { ToolResult } from '../types'

export type AgentToolArgs = Record<string, unknown>

/** Tool que registra una pantalla o diálogo mientras está montado. */
export type AgentToolDef = {
  /** `^[a-z][a-z0-9_]{2,40}$`, en español. */
  name: string
  /** Máximo 300 caracteres. */
  description: string
  /** JSON Schema de tipo `object`. */
  parameters: Record<string, unknown>
  /**
   * El usuario debe confirmar con un clic en el widget antes de ejecutarla. Obliga a definir
   * `validar` y `textoConfirmacion`: si falta alguno, el registro descarta la tool.
   */
  requiere_confirmacion?: boolean
  /**
   * Valida los argumentos y resuelve la entidad con los datos ya cargados (ej.: que el usuario_id
   * exista en la lista). Devuelve el mensaje de error, o null si es válido. Se ejecuta ANTES de
   * pedir la confirmación, para que el usuario nunca confirme algo que va a fallar.
   */
  validar?: (args: AgentToolArgs) => string | null
  /** Texto de la tarjeta de confirmación, armado con los datos reales que resolvió `validar` (nunca texto del modelo sin verificar). */
  textoConfirmacion?: (args: AgentToolArgs) => string
  /** Abre un diálogo o cambia de pestaña: tras ejecutarla se espera a que la UI nueva registre sus tools. */
  abreUi?: boolean
  /**
   * Presiona por el usuario un botón que guarda, cobra, anula o elimina. Solo se registra con
   * `VITE_AGENT_COMMIT_ACTIONS=true` (y el back solo la ofrece con `AGENT_ALLOW_COMMIT_ACTIONS`),
   * y siempre exige `requiere_confirmacion`.
   */
  ejecuta?: boolean
  run: (args: AgentToolArgs) => Promise<ToolResult>
}

/** Forma en que viaja al back (sin `run`). */
export type AgentToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
  requiere_confirmacion: boolean
  /** Solo viaja en las tools que guardan, cobran, anulan o eliminan. */
  ejecuta?: true
}

/** Las tools que guardan, cobran, anulan o eliminan están apagadas salvo que el despliegue las active. */
export function commitActionsEnabled(): boolean {
  return import.meta.env.VITE_AGENT_COMMIT_ACTIONS === 'true'
}

export const TOOL_NAME_RE = /^[a-z][a-z0-9_]{2,40}$/
export const MAX_TOOL_DESCRIPTION = 300

/** Devuelve el motivo por el que una definición no es válida, o null si lo es. */
export function validateToolDef(def: AgentToolDef): string | null {
  if (typeof def.name !== 'string' || !TOOL_NAME_RE.test(def.name)) return `nombre inválido: ${String(def.name)}`
  if (typeof def.description !== 'string' || !def.description.trim() || def.description.length > MAX_TOOL_DESCRIPTION) {
    return `descripción inválida en ${def.name} (1-${MAX_TOOL_DESCRIPTION} caracteres)`
  }
  const params = def.parameters as { type?: unknown } | null
  if (!params || typeof params !== 'object' || params.type !== 'object') {
    return `parameters de ${def.name} debe ser un JSON Schema de tipo object`
  }
  if (typeof def.run !== 'function') return `${def.name} no tiene run`
  if (def.requiere_confirmacion === true && (typeof def.validar !== 'function' || typeof def.textoConfirmacion !== 'function')) {
    return `${def.name} pide confirmación: debe definir validar y textoConfirmacion`
  }
  if (def.ejecuta === true && def.requiere_confirmacion !== true) return `${def.name} ejecuta una acción: debe pedir confirmación`
  return null
}

/**
 * Error de una tool `abrir_*` cuando el diálogo ya está abierto: el formulario no se reinicia con
 * valores nuevos, así que hay que decirlo en vez de responder "precargado".
 */
export function dialogAlreadyOpenError(fillToolName?: string): string {
  return fillToolName
    ? `El formulario ya está abierto: usa ${fillToolName} para cambiar campos.`
    : 'Ya hay un diálogo abierto en esta pantalla: el usuario debe cerrarlo antes.'
}

type RegistryState = {
  tools: Map<string, AgentToolDef[]>
  /** Sube en cada cambio del registro; sirve para esperar a que una pantalla nueva registre sus tools. */
  version: number
  register: (scopeId: string, defs: AgentToolDef[]) => void
  unregister: (scopeId: string) => void
  /** Tools vigentes. Si dos scopes repiten un nombre, gana el que se registró último. */
  getAll: () => AgentToolDef[]
}

export const useAgentToolRegistry = create<RegistryState>((set, get) => ({
  tools: new Map(),
  version: 0,

  register: (scopeId, defs) => {
    const valid: AgentToolDef[] = []
    const allowCommit = commitActionsEnabled()
    for (const def of defs) {
      const problem = validateToolDef(def)
      if (problem) console.warn(`[agent] tool descartada: ${problem}`)
      // Apagadas por configuración: ni se registran, así que ni el modelo las ve ni se pueden ejecutar.
      else if (def.ejecuta === true && !allowCommit) continue
      else valid.push(def)
    }

    const current = get().tools
    const taken = new Set<string>()
    current.forEach((list, id) => {
      if (id !== scopeId) list.forEach((def) => taken.add(def.name))
    })
    valid.forEach((def) => {
      if (taken.has(def.name)) console.warn(`[agent] tool repetida entre pantallas: ${def.name} (gana la última)`)
    })

    // Se borra y se vuelve a poner para que el scope quede al final: "gana el último".
    const next = new Map(current)
    next.delete(scopeId)
    next.set(scopeId, valid)
    set((state) => ({ tools: next, version: state.version + 1 }))
  },

  unregister: (scopeId) => {
    if (!get().tools.has(scopeId)) return
    const next = new Map(get().tools)
    next.delete(scopeId)
    set((state) => ({ tools: next, version: state.version + 1 }))
  },

  getAll: () => {
    const byName = new Map<string, AgentToolDef>()
    get().tools.forEach((list) => list.forEach((def) => byName.set(def.name, def)))
    return [...byName.values()]
  },
}))

export function toToolSpecs(defs: AgentToolDef[]): AgentToolSpec[] {
  return defs.map(({ name, description, parameters, requiere_confirmacion, ejecuta }) => ({
    name,
    description,
    parameters,
    requiere_confirmacion: requiere_confirmacion === true,
    ...(ejecuta === true ? { ejecuta: true as const } : {}),
  }))
}

type WaitOptions = {
  /** Tope absoluto de espera. */
  timeoutMs?: number
  /** Si no hay ningún cambio en este tiempo, se da por hecho que la pantalla no registra tools. */
  quietMs?: number
  /** Tras el último cambio, espera este tiempo sin más cambios (varios scopes se registran en cascada). */
  settleMs?: number
  pollMs?: number
}

/**
 * Espera a que el registro cambie respecto de `before` y se estabilice. Las rutas son
 * lazy, así que una tool que navega o abre un diálogo debe esperar antes de que el back
 * vea la lista de tools nueva. Devuelve true si hubo algún cambio.
 */
export async function waitForRegistryChange(
  getVersion: () => number,
  before: number,
  { timeoutMs = 3000, quietMs = 600, settleMs = 150, pollMs = 25 }: WaitOptions = {},
): Promise<boolean> {
  const start = Date.now()
  let last = before
  let lastChange = start
  let changed = false

  for (;;) {
    const now = Date.now()
    const version = getVersion()
    if (version !== last) {
      last = version
      lastChange = now
      changed = true
    }
    if (changed && now - lastChange >= settleMs) return true
    if (!changed && now - start >= quietMs) return false
    if (now - start >= timeoutMs) return changed
    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }
}

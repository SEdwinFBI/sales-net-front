import { useEffect, useRef } from 'react'
import { useAgentToolRegistry, type AgentToolDef } from './agent-tool-registry'

/** Firma de lo que ve el back (nombres, textos y esquemas): solo si cambia hay que re-registrar. */
export function toolsSignature(defs: AgentToolDef[]): string {
  return JSON.stringify(
    defs.map((d) => [d.name, d.description, d.parameters, d.requiere_confirmacion === true, d.abreUi === true, d.ejecuta === true]),
  )
}

/**
 * Copia de las definiciones cuyo `run`, `validar` y `textoConfirmacion` consultan siempre la
 * versión más reciente (vía `getLatest`), para no re-registrar en cada render.
 */
export function bindToLatest(defs: AgentToolDef[], getLatest: () => AgentToolDef[] | null): AgentToolDef[] {
  const find = (name: string) => getLatest()?.find((d) => d.name === name)
  return defs.map((def) => ({
    ...def,
    run: (args) => {
      const current = find(def.name)
      return current
        ? current.run(args)
        : Promise.resolve({ ok: false as const, error: 'Esa acción ya no está disponible en esta pantalla.' })
    },
    validar: def.validar
      ? (args) => {
          const current = find(def.name)
          return current ? (current.validar?.(args) ?? null) : 'Esa acción ya no está disponible en esta pantalla.'
        }
      : undefined,
    textoConfirmacion: def.textoConfirmacion ? (args) => find(def.name)?.textoConfirmacion?.(args) ?? '' : undefined,
  }))
}

/**
 * Registra las tools de una pantalla o diálogo mientras está montado y las quita al
 * desmontarse. `null` equivale a no registrar (por ejemplo, un diálogo cerrado).
 */
export function useAgentTools(scopeId: string, defs: AgentToolDef[] | null) {
  const latest = useRef(defs)
  useEffect(() => {
    latest.current = defs
  })

  const signature = defs ? toolsSignature(defs) : null

  useEffect(() => {
    const current = latest.current
    if (signature === null || !current) return
    const { register, unregister } = useAgentToolRegistry.getState()
    register(scopeId, bindToLatest(current, () => latest.current))
    return () => unregister(scopeId)
  }, [scopeId, signature])
}

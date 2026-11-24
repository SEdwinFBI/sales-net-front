import { useEffect, useState } from 'react'

function createLive<T extends object>(initial: T) {
  let current = initial
  const live = new Proxy({} as T, {
    get: (_target, key) => (current as Record<PropertyKey, unknown>)[key],
  })
  return { live, update: (next: T) => void (current = next) }
}

/**
 * Contexto de una pantalla cuyos métodos siempre consultan el render más reciente.
 *
 * Un `run` en curso conserva los getters del render en que arrancó: si espera a que termine una
 * consulta, seguiría viendo los datos viejos. Con este proxy, `ctx.getX()` lee el estado vigente
 * aunque la tool haya empezado antes de que React pintara los filtros nuevos.
 */
export function useLiveContext<T extends object>(ctx: T): T {
  const [{ live, update }] = useState(() => createLive(ctx))
  useEffect(() => {
    update(ctx)
  })
  return live
}

import type { AppRoute } from '@/lib/app-routes'

export function segmentMatches(routeSeg: string, pathSeg: string): boolean {
  return routeSeg.startsWith(':') || routeSeg === pathSeg
}

export function matchPathPrefix(pattern: string, pathname: string): { exact: boolean; prefix: boolean } {
  const pSegs = pattern.split('/').filter(Boolean)
  const uSegs = pathname.split('/').filter(Boolean)
  if (uSegs.length < pSegs.length) return { exact: false, prefix: false }
  for (let i = 0; i < pSegs.length; i++) {
    if (!segmentMatches(pSegs[i], uSegs[i])) return { exact: false, prefix: false }
  }
  return { exact: uSegs.length === pSegs.length, prefix: true }
}

/** Devuelve la cadena de nombres desde la sección padre hasta la ruta activa (exacta primero, prefijo como respaldo). */
export function findActiveRouteTrail(
  routes: AppRoute[],
  pathname: string,
  parentPath = '',
): string[] {
  let fallback: { trail: string[]; score: number } | null = null

  for (const route of routes) {
    const fullPath = parentPath ? `${parentPath}/${route.path}` : `/${route.path}`
    const label = route.meta?.name ?? route.path
    if (route.children?.length) {
      const childTrail = findActiveRouteTrail(route.children, pathname, fullPath)
      if (childTrail.length > 0) return [label, ...childTrail]
    }
    const { exact, prefix } = matchPathPrefix(fullPath, pathname)
    if (exact) {
      return [label]
    }
    if (prefix && !route.children?.length) {
      const score = fullPath.split('/').filter(Boolean).length
      if (!fallback || score > fallback.score) {
        fallback = { trail: [label], score }
      }
    }
  }

  return fallback ? fallback.trail : []
}

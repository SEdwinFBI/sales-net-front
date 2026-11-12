import type { AppRoute } from '@/lib/app-routes'
import type { AppRole } from '@/features/auth/types/auth'

export type CatalogRoute = {
  /** Path completo; puede traer segmentos `:param`. */
  path: string
  name: string
  description?: string
  /** `meta.agentHint` de la ruta: lo que el agente puede hacer en esa pantalla. */
  agentHint?: string
  hasParams: boolean
}

/** Rutas con `:param` a las que el agente puede ir, solo con ids de clientes que él mismo buscó. */
const CLIENT_PARAM_PREFIX = '/clientes/'

function isAllowed(userPermissions: AppRole[], required?: AppRole[]): boolean {
  if (!required || required.length === 0) return true
  return userPermissions.some((p) => required.includes(p))
}

function joinPath(parent: string, child: string): string {
  return `${parent}/${child}`.replace(/\/+/g, '/')
}

/**
 * Páginas (hojas con `lazy`) a las que el usuario tiene acceso, con su path
 * completo. Aplica los mismos permisos que `buildSidebarItems`/`ProtectedRoute`,
 * pero incluye también las rutas ocultas del sidebar (las de detalle `:id`).
 */
export function getCatalogRoutes(routes: AppRoute[], userPermissions: AppRole[]): CatalogRoute[] {
  const result: CatalogRoute[] = []

  const walk = (route: AppRoute, parentPath: string) => {
    if (!isAllowed(userPermissions, route.meta?.permissions)) return
    const path = joinPath(parentPath, route.path)
    if (route.meta?.lazy) {
      result.push({
        path,
        name: route.meta.name,
        description: route.meta.description,
        agentHint: route.meta.agentHint,
        hasParams: path.includes(':'),
      })
    }
    route.children?.forEach((child) => walk(child, path))
  }

  routes.forEach((route) => walk(route, '/'))
  return result
}

export type ListedRoute = { path: string; name: string; description?: string; acciones?: string; plantilla?: true }

/**
 * Rutas que se le describen al modelo: las que no llevan parámetros y, como plantilla
 * (`{id}`), las de detalle de cliente, a las que `navegar` sí puede ir con un id de
 * `buscar_cliente`. Las demás rutas con parámetros se omiten porque `navegar` las rechaza.
 */
export function getListedRoutes(catalog: CatalogRoute[]): ListedRoute[] {
  return catalog
    .filter((r) => !r.hasParams || r.path.startsWith(CLIENT_PARAM_PREFIX))
    .map(({ path, name, description, agentHint, hasParams }) => ({
      path: hasParams ? path.replace(/:[A-Za-z0-9_]+/g, '{id}') : path,
      name,
      ...(description ? { description } : {}),
      ...(agentHint ? { acciones: agentHint } : {}),
      ...(hasParams ? { plantilla: true as const } : {}),
    }))
}

export type NavigationResolution = { ok: true; path: string } | { ok: false; error: string }

/**
 * Valida un destino de navegación pedido por el modelo. Solo acepta rutas del
 * catálogo permitido; las que llevan `:param` exigen un id numérico que el
 * agente haya obtenido antes de una tool (`knownClientIds`).
 */
export function resolveNavigation(
  requested: unknown,
  catalog: CatalogRoute[],
  knownClientIds: ReadonlySet<number>,
): NavigationResolution {
  if (typeof requested !== 'string') return { ok: false, error: 'La ruta debe ser un texto.' }
  const path = requested.trim().replace(/\/+$/, '') || '/'
  if (!path.startsWith('/') || /[?#\s]/.test(path)) {
    return { ok: false, error: 'Ruta invalida.' }
  }

  const exact = catalog.find((r) => !r.hasParams && r.path === path)
  if (exact) return { ok: true, path: exact.path }

  const segments = path.split('/')
  for (const route of catalog) {
    if (!route.hasParams || !route.path.startsWith(CLIENT_PARAM_PREFIX)) continue
    const template = route.path.split('/')
    if (template.length !== segments.length) continue
    const matches = template.every((part, i) => {
      if (!part.startsWith(':')) return part === segments[i]
      return /^\d+$/.test(segments[i]) && knownClientIds.has(Number(segments[i]))
    })
    if (matches) return { ok: true, path }
  }

  return { ok: false, error: 'No tienes acceso a esa pantalla o no existe. Usa solo las rutas permitidas.' }
}

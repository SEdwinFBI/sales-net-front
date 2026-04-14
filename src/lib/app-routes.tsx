/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, type ComponentType } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router'
import { type LucideIcon } from 'lucide-react'
import type { AppRole } from '@/store/auth-store'
import ProtectedRoute from '@/components/route/ProtectedRoute'


export type AppRouteMeta = {
  name: string
  description?: string
  icon?: LucideIcon
  permissions?: AppRole[]

  lazy?: () => Promise<{ default: ComponentType }>
  /** Ocultar de sidebar. */
  hideFromSidebar?: boolean
}

export type AppRoute = {
  path: string
  element?: ReactNode
  children?: AppRoute[]
  meta?: AppRouteMeta
}


export type SidebarItem = {
  id: string
  name: string
  description?: string
  icon?: LucideIcon
  path?: string
  children: SidebarItem[]
  lazy?: () => Promise<{ default: ComponentType }>
}



/** verifica permisos */
function hasAnyPermission(userPermissions: AppRole[], required?: AppRole[]): boolean {
  if (!required || required.length === 0) return true
  return userPermissions.some((p) => required.includes(p))
}


function collectLeaves(routes: AppRoute[]): AppRoute[] {
  const result: AppRoute[] = []

  function walk(route: AppRoute) {
    if (route.meta?.lazy || !route.children?.length) {
      result.push(route)
    }
    route.children?.forEach(walk)
  }

  routes.forEach(walk)
  return result
}

/** algo tiene permisos*/
function treeHasPermission(routes: AppRoute[], userPermissions: AppRole[]): boolean {
  const leaves = collectLeaves(routes)
  return leaves.some((leaf) => hasAnyPermission(userPermissions, leaf.meta?.permissions))
}

/** Construye un SidebarItem  */
function toSidebarItem(route: AppRoute, userPermissions: AppRole[]): SidebarItem | null {
  const isLeaf = !!route.meta?.lazy
  const leafVisible = isLeaf ? hasAnyPermission(userPermissions, route.meta?.permissions) : true

  if (!leafVisible && route.meta?.permissions) return null
  if (route.meta?.hideFromSidebar) return null

  const children = (route.children ?? [])
    .map((child) => toSidebarItem(child, userPermissions))
    .filter((item): item is SidebarItem => item !== null)

  // Si no tiene hijos visibles Y no es visible → ocultar
  if (children.length === 0 && !leafVisible) return null

  return {
    id: route.path,
    name: route.meta?.name ?? route.path,
    description: route.meta?.description,
    icon: route.meta?.icon,
    path: route.path,
    children,
    lazy: route.meta?.lazy,
  }
}



/**
 * Convierte AppRoute[] en RouteObject[] para React Router.
 */
export function buildReactRoutes(routes: AppRoute[]): RouteObject[] {
  return routes.map((route) => buildRouteObject(route))
}

function buildRouteObject(route: AppRoute): RouteObject {

  const hasChildren = (route.children?.length ?? 0) > 0
  const hasLazy = !!route.meta?.lazy
  const hasPermissions = (route.meta?.permissions?.length ?? 0) > 0

  const children: RouteObject[] = []

  // Si tiene hijos pero no es leaf, agregar Navigate al primer hijo
  if (hasChildren && !hasLazy) {
    const firstVisible = route.children!.find(
      (c) => !c.meta?.permissions || c.meta.permissions.length > 0,
    )
    if (firstVisible) {
      children.push({
        index: true,
        element: <Navigate to={firstVisible.path} replace />,
      })
    }
  }


  if (hasChildren) {
    children.push(...route.children!.map(buildRouteObject))
  }


  if (hasLazy && hasChildren) {
    const lazyFn = route.meta!.lazy!
    const perms = route.meta!.permissions

    children.push({
      index: true,
      lazy: async () => {
        const mod = await lazyFn()
        const Component = mod.default
        return {
          Component: perms?.length
            ? () => (
              <ProtectedRoute allowedPermissions={perms}>
                <Component />
              </ProtectedRoute>
            )
            : Component,
        }
      },
    })
  }

  // Leaf con lazy y sin hijos 
  if (hasLazy && !hasChildren) {
    const lazyFn = route.meta!.lazy!
    return {
      path: route.path,
      lazy: async () => {
        const mod = await lazyFn()
        const Component = mod.default
        return {
          Component: hasPermissions
            ? () => (
              <ProtectedRoute allowedPermissions={route.meta!.permissions!}>
                <Component />
              </ProtectedRoute>
            )
            : Component,
        }
      },
    }
  }

  return {
    path: route.path,
    element: hasPermissions ? (
      <ProtectedRoute allowedPermissions={route.meta!.permissions!}>
        {route.element ?? <OutletWrapper />}
      </ProtectedRoute>
    ) : (
      route.element ?? <OutletWrapper />
    ),
    children,
  }
}

/** Wrapper simple para Outlet. */
export function OutletWrapper() {
  return <Outlet />
}

/**
 * Genera los ítems del sidebar filtrados por permisos del usuario.
 *
 * @param userPermissions - Permisos del usuario  ['admin', 'vendedor']
 */
export function buildSidebarItems(routes: AppRoute[], userPermissions: AppRole[]): SidebarItem[] {

  const response = routes
    .filter((route) => {
      const filtered = treeHasPermission([route], userPermissions);

      return filtered;
    })
    .map((route) => {
      const mapped = toSidebarItem(route, userPermissions);

      return mapped;
    })
    .filter((item): item is SidebarItem => item !== null)

  return response;
}



type RoleConfig = {
  homeRoute: string

}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  admin: {
    homeRoute: '/catalogo/productos',

  },
  vendedor: {
    homeRoute: '/venta/punto-de-venta',

  },
}

/**
 * Encuentra la primera ruta disponible para un rol (home redirect).
 * Busca la primera hoja con permiso y retorna su path completo.
 *
 * @param role - Rol principal del usuario (para redireccionar)
 */
export function getHomeRoute(role: AppRole): string {
  return ROLE_CONFIG[role].homeRoute ?? '/acceso-denegado'
}

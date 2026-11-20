import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Store, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/helpers/string'
import type { AppRoute, SidebarItem } from '@/lib/app-routes'
import { allFeatureRoutes } from '@/routes/feature-routes'
import type { User } from '@/features/auth/types/auth'
import { useThemeStore } from '@/features/core/store/theme-store'

type LayoutHeaderProps = {
  hasSidebarNavigation: boolean
  isDesktop: boolean
  isMobileSidebarOpen: boolean
  isSidebarExpanded: boolean
  isSidebarPinned: boolean
  sidebarItems: SidebarItem[]
  user: User
  onLogout: () => void
  onSidebarToggle: () => void
  onSettings: () => void
}

function segmentMatches(routeSeg: string, pathSeg: string): boolean {
  return routeSeg.startsWith(':') || routeSeg === pathSeg
}

function matchPathPrefix(pattern: string, pathname: string): { exact: boolean; prefix: boolean } {
  const pSegs = pattern.split('/').filter(Boolean)
  const uSegs = pathname.split('/').filter(Boolean)
  if (uSegs.length < pSegs.length) return { exact: false, prefix: false }
  for (let i = 0; i < pSegs.length; i++) {
    if (!segmentMatches(pSegs[i], uSegs[i])) return { exact: false, prefix: false }
  }
  return { exact: uSegs.length === pSegs.length, prefix: true }
}

function findActiveRouteTrail(
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

function LayoutHeader({
  hasSidebarNavigation,
  isDesktop,
  isMobileSidebarOpen,
  isSidebarExpanded,
  isSidebarPinned,
  sidebarItems,
  user,
  onLogout,
  onSidebarToggle,
  onSettings,
}: LayoutHeaderProps) {
  const location = useLocation()
  const displayName = user.fullName?.trim() || user.username
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const routeTrail = useMemo(
    () => findActiveRouteTrail(allFeatureRoutes, location.pathname),
    [location.pathname],
  )
  const activePageName = routeTrail.at(-1)
  const parentSectionName = routeTrail.length > 1 ? routeTrail[0] : null
  void sidebarItems

  const sidebarLabel = isDesktop
    ? isSidebarPinned
      ? 'Contraer menú lateral'
      : 'Expandir menú lateral'
    : isMobileSidebarOpen
      ? 'Cerrar menú lateral'
      : 'Abrir menú lateral'

  return (
    <header className="sticky top-2.5 z-20 rounded-2xl border border-border/80 bg-card/90 px-3 py-2.5 shadow-card backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Izquierda: botón sidebar + contexto dinámico de ruta */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            aria-controls="app-sidebar"
            aria-expanded={isSidebarExpanded}
            aria-label={sidebarLabel}
            title={sidebarLabel}
            className={cn(
              'size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60',
              isSidebarPinned
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                : 'border-border bg-background/70 text-foreground hover:border-primary/35 hover:bg-accent/70 hover:text-primary',
              hasSidebarNavigation ? 'inline-flex' : 'hidden',
            )}
          >
            {isDesktop ? (
              isSidebarPinned ? (
                <PanelLeftClose className="size-[18px]" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
              )
            ) : isMobileSidebarOpen ? (
              <X className="size-[18px]" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {parentSectionName ? `Distribuidora MZ · ${parentSectionName}` : 'Distribuidora MZ'}
            </p>
            <p className="truncate font-heading text-sm font-semibold leading-snug text-foreground sm:text-[0.95rem]">
              {activePageName ?? 'Tablero comercial'}
            </p>
          </div>
        </div>

        {/* Derecha: usuario + acciones rápidas */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Chip de identidad */}
          <div className="hidden items-center gap-2.5 rounded-xl border border-border/70 bg-muted/45 px-2.5 py-1.5 sm:flex">
            <div
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/14 text-[11px] font-bold text-primary"
            >
              {initials(displayName)}
            </div>
            <div className="min-w-0 text-left leading-tight">
              <p className="max-w-36 truncate text-xs font-semibold text-foreground">
                {displayName}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Store className="size-2.5 shrink-0 text-primary/70" aria-hidden="true" />
                <span className="max-w-32 truncate">{user.sucursalActual?.nombre ?? user.username}</span>
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/35 p-1">
            {user.permissions.includes('admin') && (
              <button
                type="button"
                onClick={onSettings}
                aria-label="Configurar notificaciones"
                title="Configurar notificaciones"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground hover:shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings className="size-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground hover:shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {theme === 'dark' ? (
                <Sun className="size-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-destructive/85 transition-colors hover:bg-destructive/12 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Identidad compacta en mobile */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-1.5 text-[11px] sm:hidden">
        <span className="truncate font-semibold text-foreground">{displayName}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 font-medium text-muted-foreground">
          <Store className="size-3 text-primary" aria-hidden="true" />
          <span className="max-w-32 truncate">{user.sucursalActual?.nombre ?? user.username}</span>
        </span>
      </div>
    </header>
  )
}

export default LayoutHeader

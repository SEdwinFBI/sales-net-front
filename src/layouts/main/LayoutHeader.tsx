import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { LogOut, Mic, MicOff, Moon, PanelLeftClose, PanelLeftOpen, Settings, Store, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/helpers/string'
import type { SidebarItem } from '@/lib/app-routes'
import { findActiveRouteTrail } from '@/lib/route-trail'
import { allFeatureRoutes } from '@/routes/feature-routes'
import type { User } from '@/features/auth/types/auth'
import { useThemeStore } from '@/features/core/store/theme-store'
import { useMicArbitratorStore, type MicPermissionStatus } from '@/features/core/store/useMicArbitratorStore'
import QuickSearchBar from '@/features/core/quick-search/QuickSearchBar'
import { sourcesForPermissions } from '@/features/core/quick-search/quick-search-config'

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

function getSellerMicIndicator(status: MicPermissionStatus, isStreaming: boolean) {
  switch (status) {
    case 'granted':
      return {
        label: isStreaming ? 'Audio en vivo' : 'Audio activo',
        title: isStreaming
          ? 'Un administrador está escuchando tu audio en vivo'
          : 'Micrófono activo para comunicación en vivo',
        className: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        blocked: false,
      }
    case 'paused_for_speech':
      return {
        label: 'Dictado activo',
        title: 'Audio en pausa temporal mientras usas el dictado por voz',
        className: 'border-primary/30 bg-primary/12 text-primary',
        blocked: false,
      }
    case 'prompt':
      return {
        label: 'Permitir mic',
        title: 'Haz clic o toca para conceder el permiso de micrófono',
        className: 'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300',
        blocked: false,
      }
    case 'denied':
      return {
        label: 'Mic denegado',
        title: 'Permiso de micrófono denegado en la configuración del navegador',
        className: 'border-destructive/30 bg-destructive/12 text-destructive',
        blocked: true,
      }
    case 'unsupported':
    case 'error':
      return {
        label: 'Sin micrófono',
        title: 'No hay acceso al micrófono en este dispositivo o navegador',
        className: 'border-destructive/30 bg-destructive/12 text-destructive',
        blocked: true,
      }
    default:
      return {
        label: 'Iniciando audio',
        title: 'Preparando canal de audio',
        className: 'border-border bg-muted/60 text-muted-foreground',
        blocked: false,
      }
  }
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

  const isSeller = user.role === 'vendedor'
  const micStatus = useMicArbitratorStore((state) => state.micStatus)
  const isStreaming = useMicArbitratorStore((state) => state.isStreamingToAdmin)
  const promptTrigger = useMicArbitratorStore((state) => state.promptTrigger)
  const micIndicator = getSellerMicIndicator(micStatus, isStreaming)

  const routeTrail = useMemo(
    () => findActiveRouteTrail(allFeatureRoutes, location.pathname),
    [location.pathname],
  )
  const activePageName = routeTrail.at(-1)
  // Accesos de busqueda rapida que el rol puede usar. En el telefono ocupan el lugar del titulo.
  const quickSources = useMemo(() => sourcesForPermissions(user.permissions), [user.permissions])
  const hasQuickSearch = quickSources.length > 0
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

          <div className={cn('min-w-0', hasQuickSearch && 'hidden sm:block')}>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {parentSectionName ? `Distribuidora MZ · ${parentSectionName}` : 'Distribuidora MZ'}
            </p>
            <p className="truncate font-heading text-sm font-semibold leading-snug text-foreground sm:text-[0.95rem]">
              {activePageName ?? 'Tablero comercial'}
            </p>
          </div>

          <QuickSearchBar sources={quickSources} className="sm:ml-2" />
        </div>

        {/* Derecha: estado mic vendedor + usuario + acciones rápidas */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {isSeller && (
            micStatus === 'prompt' && promptTrigger ? (
              <button
                type="button"
                onClick={promptTrigger}
                title={micIndicator.title}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-90',
                  micIndicator.className,
                )}
              >
                <Mic className="size-3.5 animate-pulse" aria-hidden="true" />
                <span className="hidden md:inline">{micIndicator.label}</span>
              </button>
            ) : (
              <span
                title={micIndicator.title}
                aria-label={micIndicator.title}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold select-none',
                  micIndicator.className,
                )}
              >
                {micIndicator.blocked ? (
                  <MicOff className="size-3.5" aria-hidden="true" />
                ) : (
                  <span className="relative flex items-center justify-center">
                    {isStreaming && (
                      <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-current opacity-35" />
                    )}
                    <Mic className="relative size-3.5" aria-hidden="true" />
                  </span>
                )}
                <span className="hidden md:inline">{micIndicator.label}</span>
              </span>
            )
          )}

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
        <span className="truncate font-semibold text-foreground">
          {/* Con los accesos en el lugar del titulo, el nombre de la pagina baja aqui. */}
          {hasQuickSearch ? `${activePageName ?? 'Tablero comercial'} · ${displayName}` : displayName}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 font-medium text-muted-foreground">
          <Store className="size-3 text-primary" aria-hidden="true" />
          <span className="max-w-32 truncate">{user.sucursalActual?.nombre ?? user.username}</span>
        </span>
      </div>
    </header>
  )
}

export default LayoutHeader

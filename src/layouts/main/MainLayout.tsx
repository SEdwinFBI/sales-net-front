import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { isTokenExpired, useAuthStore } from '@/features/core/store/auth-store'
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { buildSidebarItems } from '@/lib/app-routes'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'

import { adminUsuariosRoutes } from '@/features/adminUsuarios'

import DesktopSidebar from './DesktopSidebar'
import MobileSidebar from './MobileSidebar'
import LayoutHeader from './LayoutHeader'
import { useDesktopMediaQuery } from '@/features/core/hooks/useDesktopMediaQuery'
import { reportingRoutes } from '@/features/reporting'
import { clientesRoutes } from '@/features/customers'

const allFeatureRoutes = [
  ...reportingRoutes,
  ...salesRoutes,
  ...clientesRoutes,
  ...catalogRoutes,
  ...adminUsuariosRoutes
]

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const refreshExpiresAt = useAuthStore((state) => state.refreshExpiresAt)
  const { mutate: logoutServer } = useLogoutMutation()
  const navigate = useNavigate()
  const location = useLocation()

  const { isDesktop } = useDesktopMediaQuery()

  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const sidebarHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasSidebarNavigation = true

  // Expansión automática del sidebar al pasar el mouse: DESACTIVADA
  // temporalmente. Poner en true para reactivarla.
  const SIDEBAR_HOVER_EXPAND = false

  const isDesktopSidebarExpanded = isSidebarPinned || (SIDEBAR_HOVER_EXPAND && isSidebarHovered)

  const sidebarItems = useMemo(
    () => (user ? buildSidebarItems(allFeatureRoutes, user.permissions) : []),
    [user]
  )

  const clearSidebarHoverTimer = useCallback(() => {
    if (sidebarHoverTimer.current) {
      clearTimeout(sidebarHoverTimer.current)
      sidebarHoverTimer.current = null
    }
  }, [])

  const handleLogout = useCallback(() => {
    // Invalida el refresh token en el servidor y limpia el estado local
    // (onSettled del mutation hace el logout local aunque el server falle).
    logoutServer()
    navigate('/login', { replace: true })
  }, [logoutServer, navigate])

  const handleSidebarToggle = useCallback(() => {
    if (!hasSidebarNavigation) return
    if (isDesktop) {
      setIsSidebarPinned((c) => !c)
    } else {
      setIsMobileSidebarOpen((c) => !c)
    }
  }, [hasSidebarNavigation, isDesktop])

  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  const handleDesktopSidebarMouseEnter = useCallback(() => {
    if (!SIDEBAR_HOVER_EXPAND) return
    clearSidebarHoverTimer()
    sidebarHoverTimer.current = setTimeout(() => {
      setIsSidebarHovered(true)
    }, 60)
  }, [clearSidebarHoverTimer])

  const handleDesktopSidebarMouseLeave = useCallback(() => {
    if (!SIDEBAR_HOVER_EXPAND) return
    clearSidebarHoverTimer()
    sidebarHoverTimer.current = setTimeout(() => {
      setIsSidebarHovered(false)
    }, 100)
  }, [clearSidebarHoverTimer])

  useEffect(() => clearSidebarHoverTimer, [clearSidebarHoverTimer])

  // Solo expulsa cuando el REFRESH token (la sesión real) expiró; un access
  // vencido se renueva automáticamente en la siguiente petición.
  if (!user || !token || isTokenExpired(refreshExpiresAt)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-screen bg-secondary text-neutral">
      {!isDesktop && (
        <MobileSidebar
          items={sidebarItems}
          isOpen={isMobileSidebarOpen}
          onClose={handleMobileSidebarClose}
        />
      )}

      <div className="grid min-h-screen grid-cols-1 gap-3 px-2.5 py-2.5 sm:gap-4 sm:px-4 lg:grid-cols-[auto_1fr]">
        {isDesktop && (
          <DesktopSidebar
            expanded={isDesktopSidebarExpanded}
            items={sidebarItems}
            onMouseEnter={handleDesktopSidebarMouseEnter}
            onMouseLeave={handleDesktopSidebarMouseLeave}
          />
        )}

        <div className="flex min-w-0 flex-col">
          <LayoutHeader
            hasSidebarNavigation={hasSidebarNavigation}
            isDesktop={isDesktop}
            isMobileSidebarOpen={isMobileSidebarOpen}
            isSidebarExpanded={isDesktopSidebarExpanded}
            isSidebarPinned={isSidebarPinned}
            user={user}
            onLogout={handleLogout}
            onSidebarToggle={handleSidebarToggle}
          />

          <main className="min-w-0 flex-1 py-2 pb-8 sm:py-3">
            <Outlet />
          </main>

          <footer className="pb-4 text-[12px] text-neutral/75 self-center">
            &copy; {new Date().getFullYear()} Code QX.  Código que construye el futuro, Todos los derechos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}

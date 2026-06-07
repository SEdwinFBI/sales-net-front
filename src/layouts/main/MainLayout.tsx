import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { isTokenExpired, useAuthStore } from '@/features/core/store/auth-store'
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

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const { isDesktop } = useDesktopMediaQuery()

  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const hasSidebarNavigation = true

  const isDesktopSidebarExpanded = isSidebarPinned || isSidebarHovered

  // Generar items del sidebar desde las rutas, filtrados por permisos del usuario
  const allFeatureRoutes = [
    ...salesRoutes,
    ...reportingRoutes,
    ...clientesRoutes,
    ...catalogRoutes,
    ...adminUsuariosRoutes
  ]
  const sidebarItems = user
    ? buildSidebarItems(allFeatureRoutes, user.permissions)
    : []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSidebarToggle = () => {
    if (!hasSidebarNavigation) return
    if (isDesktop) {
      setIsSidebarPinned((c) => !c)
    } else {
      setIsMobileSidebarOpen((c) => !c)
    }
  }

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false)
  }

  if (!user || !token || isTokenExpired(tokenExpiresAt)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-neutral">
      {!isDesktop && (
        <MobileSidebar
          items={sidebarItems}
          isOpen={isMobileSidebarOpen}
          onClose={handleMobileSidebarClose}
        />
      )}

      <div className="grid min-h-screen grid-cols-1 gap-4 px-2 py-2 lg:grid-cols-[auto_1fr]">
        {isDesktop && (
          <DesktopSidebar
            expanded={isDesktopSidebarExpanded}
            items={sidebarItems}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
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

          <main className="flex-1 py-2 pb-8">
            <Outlet />
          </main>

          <footer className="pb-4 text-[12px] text-neutral/75 self-center">
            &copy; {new Date().getFullYear()} Code QX. Todos los derechos reservados.
          </footer>
        </div>
      </div>
    </div>
  )
}

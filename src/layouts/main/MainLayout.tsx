import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useDesktopMediaQuery } from '@/hooks/useDesktopMediaQuery'
import { useAuthStore } from '@/store/auth-store'
import { buildSidebarItems } from '@/lib/app-routes'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'
import DesktopSidebar from './DesktopSidebar'
import MobileSidebar from './MobileSidebar'
import LayoutHeader from './LayoutHeader'

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const { isDesktop } = useDesktopMediaQuery()

  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const hasSidebarNavigation = true

  const isDesktopSidebarExpanded = isSidebarPinned || isSidebarHovered

  // Generar items del sidebar desde las rutas, filtrados por permisos del usuario
  const allFeatureRoutes = [...salesRoutes, ...catalogRoutes]
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

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-neutral">
      {!isDesktop && (
        <MobileSidebar items={sidebarItems} isOpen={isMobileSidebarOpen} onClose={handleMobileSidebarClose} />
      )}

      <div className="grid min-h-screen grid-cols-1 gap-4 px-1 py-1 md:px-6 md:py-4 lg:grid-cols-[auto_1fr] lg:gap-6 xl:px-8">
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
            onLogout={handleLogout}
            onSidebarToggle={handleSidebarToggle}
          />

          <main className="flex-1 py-2 pb-8">
            <Outlet />
          </main>

          <footer className="pb-4 text-sm text-neutral/75">
            footer
          </footer>
        </div>
      </div>
    </div>
  )
}

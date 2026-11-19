import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import NavBarDesktop, { isItemOrDescendantActive } from '@/components/navbar/NavBarDesktop'
import { cn } from '@/lib/utils'
import type { SidebarItem } from '@/lib/app-routes'

const NAV_EXPANDED_KEY = 'sales-net-nav-expanded'

type DesktopSidebarProps = {
  expanded: boolean
  items: SidebarItem[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onExpandRequest?: () => void
}

/**
 * Sidebar de escritorio. Los módulos expandidos se persisten en localStorage
 * y el módulo de la ruta activa se mantiene visible salvo cierre manual.
 */
function DesktopSidebar({ expanded, items, onMouseEnter, onMouseLeave, onExpandRequest }: DesktopSidebarProps) {
  const location = useLocation()
  const [savedModules, setSavedModules] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(NAV_EXPANDED_KEY) ?? '[]') as string[]
    } catch {
      return []
    }
  })
  const [collapsedManually, setCollapsedManually] = useState<string[]>([])

  const activeIds = useMemo(
    () =>
      items
        .filter((item) => item.children.length > 0 && isItemOrDescendantActive(item, location.pathname))
        .map((item) => item.id),
    [items, location.pathname],
  )

  const expandedModules = useMemo(
    () =>
      Array.from(
        new Set([
          ...savedModules,
          ...activeIds.filter((id) => !collapsedManually.includes(id)),
        ]),
      ),
    [savedModules, activeIds, collapsedManually],
  )

  const toggleModule = (moduleId: string) => {
    const isCurrentlyExpanded = expandedModules.includes(moduleId)
    const nextSaved = isCurrentlyExpanded
      ? savedModules.filter((id) => id !== moduleId)
      : Array.from(new Set([...savedModules, moduleId]))

    setSavedModules(nextSaved)
    setCollapsedManually((prev) =>
      isCurrentlyExpanded
        ? Array.from(new Set([...prev, moduleId]))
        : prev.filter((id) => id !== moduleId),
    )

    try {
      localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(nextSaved))
    } catch {
      /* localStorage no disponible */
    }
  }

  return (
    <aside
      id="app-sidebar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'sticky top-3 hidden h-[calc(100vh-1.5rem)] overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar p-2.5 shadow-card contain-layout contain-paint transition-[width,box-shadow] duration-200 ease-out will-change-[width] lg:block',
        expanded ? 'w-64' : 'w-[4.75rem]',
      )}
    >
      <NavBarDesktop
        items={items}
        expanded={expanded}
        onExpandRequest={onExpandRequest}
        expandedModules={expandedModules}
        onToggleModule={toggleModule}
      />
    </aside>
  )
}

export default DesktopSidebar

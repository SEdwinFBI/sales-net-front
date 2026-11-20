import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { X } from 'lucide-react'
import NavBarDesktop, { isItemOrDescendantActive } from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

type MobileSidebarProps = {
  items: SidebarItem[]
  isOpen: boolean
  onClose: () => void
}

function MobileSidebar({ items, isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation()
  const [expandedModules, setExpandedModules] = useState<string[]>(() =>
    items
      .filter((item) => item.children.length > 0 && isItemOrDescendantActive(item, location.pathname))
      .map((item) => item.id),
  )

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-200 ease-out lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Sidebar panel */}
      <aside
        id="app-sidebar"
        aria-label="Menú lateral"
        className={cn(
          'fixed inset-y-3 left-3 z-40 w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar p-3 shadow-elevated transition-transform duration-200 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1.5rem)]',
        )}
      >
        <NavBarDesktop
          items={items}
          expanded
          onNavigate={onClose}
          expandedModules={expandedModules}
          onToggleModule={toggleModule}
          headerAction={
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="size-4" />
            </button>
          }
        />
      </aside>
    </>
  )
}

export default MobileSidebar

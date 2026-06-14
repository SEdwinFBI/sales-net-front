import { useState } from 'react'
import { useLocation } from 'react-router'
import NavBarDesktop, { isItemOrDescendantActive } from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

const NAV_EXPANDED_KEY = 'sales-net-nav-expanded'

type DesktopSidebarProps = {
    expanded: boolean
    items: SidebarItem[]
    onMouseEnter: () => void
    onMouseLeave: () => void
}

function DesktopSidebar({ expanded, items, onMouseEnter, onMouseLeave }: DesktopSidebarProps) {
    const location = useLocation()
    const [expandedModules, setExpandedModules] = useState<string[]>(() => {
        const activeIds = items
            .filter((item) => item.children.length > 0 && isItemOrDescendantActive(item, location.pathname))
            .map((item) => item.id)
        try {
            const saved = JSON.parse(localStorage.getItem(NAV_EXPANDED_KEY) ?? '[]') as string[]
            return Array.from(new Set([...saved, ...activeIds]))
        } catch {
            return activeIds
        }
    })

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
            try {
                localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(next))
            } catch {
                /* localStorage no disponible */
            }
            return next
        })
    }

    return (
        <aside
            id="app-sidebar"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={cn(
                'sticky top-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border p-3 contain-layout contain-paint transition-[width,background-color,border-color] duration-200 ease-out will-change-[width] lg:block',
                expanded
                    ? 'w-64 border-border/70 bg-white shadow-sm'
                    : 'w-24 border-border/60 bg-white/80 shadow-sm',
            )}
        >
            <NavBarDesktop
                items={items}
                expanded={expanded}
                expandedModules={expandedModules}
                onToggleModule={toggleModule}
            />
        </aside>
    )
}

export default DesktopSidebar

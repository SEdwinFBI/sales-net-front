import { useState } from 'react'
import NavBarDesktop from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

type DesktopSidebarProps = {
    expanded: boolean
    items: SidebarItem[]
    onMouseEnter: () => void
    onMouseLeave: () => void
}

function DesktopSidebar({ expanded, items, onMouseEnter, onMouseLeave }: DesktopSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<string[]>([])

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        )
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

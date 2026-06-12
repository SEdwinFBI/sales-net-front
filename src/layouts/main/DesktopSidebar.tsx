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
                'sticky top-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border p-3 backdrop-blur-2xl transition-all duration-300 ease-out lg:block',
                expanded
                    ? 'w-64 border-stone-200/50 bg-gradient-to-b from-stone-50/95 via-white/90 to-zinc-50/85 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_24px_rgba(0,0,0,0.04)]'
                    : 'w-25 border-stone-200/25 bg-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.01),0_2px_16px_rgba(0,0,0,0.03)]',
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

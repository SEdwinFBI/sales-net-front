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
                'sticky top-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border p-2 backdrop-blur-xl transition-[width,background-color,border-color,box-shadow] duration-260 ease-out lg:block',
                expanded
                    ? 'w-64 border-white/80 bg-white/88 shadow-[0_28px_70px_-36px_rgba(53,37,205,0.32)]'
                    : 'w-25 border-white/65 bg-white/72 shadow-[0_24px_60px_-36px_rgba(53,37,205,0.28)]',
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

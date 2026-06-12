import { useState } from 'react'
import NavBarDesktop from "@/components/navbar/NavBarDesktop"
import { cn } from "@/lib/utils"
import type { SidebarItem } from "@/lib/app-routes"

type MobileSidebarProps = {
    items: SidebarItem[]
    isOpen: boolean
    onClose: () => void
}

function MobileSidebar({ items, isOpen, onClose }: MobileSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<string[]>([])

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        )
    }

    return (
        <>
            {/* Overlay */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            />

            {/* Sidebar panel */}
            <aside
                id="app-sidebar"
                className={cn(
                    'fixed inset-y-3 left-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-stone-200/50 bg-gradient-to-b from-stone-50/95 via-white/92 to-zinc-50/85 p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden',
                    isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
                )}
            >
                <div className="h-full px-2 pb-2">
                    <NavBarDesktop
                        items={items}
                        expanded
                        onNavigate={onClose}
                        expandedModules={expandedModules}
                        onToggleModule={toggleModule}
                    />
                </div>
            </aside>
        </>
    )
}

export default MobileSidebar

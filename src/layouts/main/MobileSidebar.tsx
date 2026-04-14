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
                    'fixed inset-0 z-30 bg-[#101626]/36 backdrop-blur-[2px] transition-opacity duration-220 ease-out lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            />

            {/* Sidebar panel */}
            <aside
                id="app-sidebar"
                className={cn(
                    'fixed inset-y-3 left-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-[2rem] border border-white/65 bg-white/88 p-2 shadow-[0_28px_70px_-36px_rgba(53,37,205,0.32)] backdrop-blur-xl transition-transform duration-260 ease-out lg:hidden',
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

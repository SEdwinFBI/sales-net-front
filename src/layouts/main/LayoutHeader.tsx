import { cn } from "@/lib/utils"
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import type { User } from "@/features/auth/types/auth"

type LayoutHeaderProps = {
    hasSidebarNavigation: boolean
    isDesktop: boolean
    isMobileSidebarOpen: boolean
    isSidebarExpanded: boolean
    isSidebarPinned: boolean
    user: User
    onLogout: () => void
    onSidebarToggle: () => void
}


function LayoutHeader({
    hasSidebarNavigation,
    isDesktop,
    isMobileSidebarOpen,
    isSidebarExpanded,
    isSidebarPinned,
    user,
    onLogout,
    onSidebarToggle,
}: LayoutHeaderProps) {
    const displayName = user.fullName?.trim() || user.username

    const sidebarLabel = isDesktop
        ? isSidebarPinned
            ? 'Liberar sidebar'
            : 'Mantener sidebar abierto'
        : isMobileSidebarOpen
            ? 'Cerrar menu lateral'
            : 'Abrir menu lateral'

    return (
        <header className="sticky top-0 z-10 rounded-2xl border border-secondary bg-white/92 px-4 py-3 shadow-[0_24px_60px_-42px_rgba(53,37,205,0.26)] backdrop-blur sm:rounded-4xl sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onSidebarToggle}
                        aria-controls="app-sidebar"
                        aria-expanded={isSidebarExpanded}
                        aria-label={sidebarLabel}
                        className={cn(
                            'size-11 items-center justify-center rounded-2xl border border-secondary bg-secondary/58 text-neutral transition hover:bg-secondary',
                            hasSidebarNavigation ? 'inline-flex' : 'hidden',
                        )}
                    >
                        {isDesktop ? (
                            isSidebarPinned ? (
                                <PanelLeftClose className="size-5" />
                            ) : (
                                <PanelLeftOpen className="size-5" />
                            )
                        ) : isMobileSidebarOpen ? (
                            <X className="size-5" />
                        ) : (
                            <PanelLeftOpen className="size-5" />
                        )}
                    </button>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:tracking-[0.3em]">
                            Distribuidora MZ
                        </p>
                        <p className="text-sm text-neutral/70">
                            Tablero comercial
                        </p>
                    </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0 text-right">
                        <p className="max-w-42 truncate text-sm font-semibold text-neutral">
                            {displayName}
                        </p>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral/55">
                            {user?.username}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        aria-label="Cerrar sesión"
                        className="inline-flex size-10 items-center justify-center rounded-full border border-secondary bg-white text-neutral transition hover:bg-secondary"
                    >
                        <LogOut className="size-4 text-[--color-danger]" />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default LayoutHeader

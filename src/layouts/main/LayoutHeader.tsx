import { cn } from "@/lib/utils"
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Sun, X } from "lucide-react"
import type { User } from "@/features/auth/types/auth"
import { useThemeStore } from "@/features/core/store/theme-store"

type LayoutHeaderProps = {
    hasSidebarNavigation: boolean
    isDesktop: boolean
    isMobileSidebarOpen: boolean
    isSidebarExpanded: boolean
    isSidebarPinned: boolean
    user: User
    onLogout: () => void
    onSidebarToggle: () => void
    onSettings: () => void
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
    onSettings,
}: LayoutHeaderProps) {
    const displayName = user.fullName?.trim() || user.username
    const theme = useThemeStore((state) => state.theme)
    const toggleTheme = useThemeStore((state) => state.toggleTheme)

    const sidebarLabel = isDesktop
        ? isSidebarPinned
            ? 'Liberar sidebar'
            : 'Mantener sidebar abierto'
        : isMobileSidebarOpen
            ? 'Cerrar menu lateral'
            : 'Abrir menu lateral'

    return (
        <header className="sticky top-0 z-10 rounded-2xl border border-border/70 bg-card/95 px-3.5 py-3 shadow-sm backdrop-blur sm:px-5">
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <div className="order-1 w-full flex items-center gap-3 min-[400px]:w-auto">
                    <button
                        type="button"
                        onClick={onSidebarToggle}
                        aria-controls="app-sidebar"
                        aria-expanded={isSidebarExpanded}
                        aria-label={sidebarLabel}
                        className={cn(
                            'size-10 items-center justify-center rounded-xl border transition-[background-color,border-color,color] duration-150',
                            isSidebarPinned
                                ? 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/15'
                                : 'border-border bg-card text-neutral hover:bg-primary-nav',
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

                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:tracking-[0.22em]">
                            Distribuidora MZ
                        </p>
                        <p className="truncate text-sm text-neutral/70">
                            Tablero comercial
                        </p>
                    </div>
                </div>

                <div className="order-3 ml-auto flex shrink-0 items-center gap-2 min-[400px]:max-sm:order-2 sm:order-3 sm:ml-0 sm:gap-3">
                    {user.permissions.includes('admin') && (
                        <button
                            type="button"
                            onClick={onSettings}
                            aria-label="Configurar notificaciones"
                            title="Configurar notificaciones"
                            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-neutral transition hover:bg-primary-nav"
                        >
                            <Settings className="size-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-neutral transition hover:bg-primary-nav"
                    >
                        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={onLogout}
                        aria-label="Cerrar sesión"
                        className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-neutral transition hover:bg-primary-nav"
                    >
                        <LogOut className="size-4 text-[--color-danger]" />
                    </button>
                </div>

                <div className="order-2 min-w-0 min-[400px]:max-sm:order-3 min-[400px]:max-sm:w-full min-[400px]:max-sm:text-center sm:order-2 sm:ml-auto sm:w-auto sm:text-right">
                    <p className="max-w-40 truncate text-sm font-semibold text-neutral min-[400px]:max-sm:mx-auto min-[400px]:max-sm:max-w-56 sm:max-w-42">
                        {displayName}
                    </p>
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral/55">
                        {user.sucursalActual?.nombre ?? user.username}
                    </p>
                </div>
            </div>
        </header>
    )
}

export default LayoutHeader

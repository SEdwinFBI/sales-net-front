import { ChevronRight } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import logoImage from '@/assets/logo.jpg'
import type { SidebarItem } from '@/lib/app-routes'

type NavBarDesktopProps = {
  items: SidebarItem[]
  expanded?: boolean
  onNavigate?: () => void
  onExpandRequest?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
  headerAction?: React.ReactNode
}

/** Concatena el path del item con el de su padre para armar la ruta absoluta. */
function buildFullPath(item: SidebarItem, parentPath?: string): string {
  const currentPath = parentPath ? `${parentPath}/${item.path}` : `/${item.path}`
  return currentPath
}

/** True si el item o alguno de sus descendientes corresponde a la ruta actual. */
export function isItemOrDescendantActive(item: SidebarItem, currentPathname: string, parentPath?: string): boolean {
  const fullPath = buildFullPath(item, parentPath)
  if (currentPathname === fullPath || currentPathname.startsWith(`${fullPath}/`)) return true
  return item.children.some((child) => isItemOrDescendantActive(child, currentPathname, fullPath))
}

/** Sub-items de un módulo expandido, con una guía vertical limpia que marca la jerarquía activa. */
function SubItems({
  items,
  expanded,
  onNavigate,
  expandedModules,
  onToggleModule,
  parentPath,
  depth,
}: {
  items: SidebarItem[]
  expanded: boolean
  onNavigate?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
  parentPath: string
  depth: number
}) {
  const location = useLocation()

  const hasActiveInLevel = items.some((item) =>
    isItemOrDescendantActive(item, location.pathname, parentPath),
  )

  return (
    <div
      className={cn(
        'relative ml-4 pl-3 before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-px before:rounded-full before:transition-colors before:duration-150',
        hasActiveInLevel ? 'before:bg-white/45' : 'before:bg-white/18',
        depth > 0 && 'mt-1',
      )}
    >
      <div className="space-y-0.5 py-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const fullPath = buildFullPath(item, parentPath)
          const isLeaf = !!item.lazy && !hasChildren
          const isItemExpanded = expandedModules?.includes(item.id) ?? false
          const isActiveItem = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)

          if (isLeaf) {
            return (
              <NavLink
                key={item.id}
                to={fullPath}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-8.5 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem] transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isActive
                      ? 'bg-white/22 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]'
                      : 'font-medium text-white/85 hover:bg-white/14 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 -left-3 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white"
                      />
                    )}
                    {Icon ? (
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-3.5 shrink-0 transition-colors duration-150',
                          isActive ? 'text-white' : 'text-white/55 group-hover:text-white/85',
                        )}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-1.5 shrink-0 rounded-full transition-colors duration-150',
                          isActive ? 'bg-white' : 'bg-white/35 group-hover:bg-white/70',
                        )}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          }

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isItemExpanded}
                onClick={() => onToggleModule?.(item.id)}
                className={cn(
                  'group relative flex min-h-8.5 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[0.8125rem] transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  isActiveItem
                    ? 'bg-white/14 font-semibold text-white'
                    : 'font-medium text-white/75 hover:bg-white/10 hover:text-white',
                )}
              >
                {Icon ? (
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      'size-3.5 shrink-0 transition-colors duration-150',
                      isActiveItem ? 'text-white' : 'text-white/55 group-hover:text-white/85',
                    )}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      isActiveItem ? 'bg-white' : 'bg-white/35',
                    )}
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 shrink-0 text-white/55 transition-transform duration-150',
                    isItemExpanded && 'rotate-90 text-white/85',
                  )}
                />
              </button>

              {isItemExpanded && (
                <SubItems
                  items={item.children}
                  expanded={expanded}
                  onNavigate={onNavigate}
                  expandedModules={expandedModules}
                  onToggleModule={onToggleModule}
                  parentPath={fullPath}
                  depth={depth + 1}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function NavBarDesktop({
  items,
  expanded = false,
  onNavigate,
  onExpandRequest,
  expandedModules = [],
  onToggleModule,
  headerAction,
}: NavBarDesktopProps) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div
        className={cn(
          'flex items-center rounded-xl border border-white/15 bg-white/10 py-2.5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] backdrop-blur-xs transition-[padding,gap] duration-150 ease-out',
          expanded ? 'justify-between gap-2.5 px-3' : 'justify-center px-1.5',
        )}
      >
        <div className={cn('flex min-w-0 items-center', expanded ? 'gap-2.5' : 'justify-center')}>
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-xs ring-1 ring-white/30">
            <img src={logoImage} alt="Logo Distribuidora MZ" className="h-full w-full object-contain" />
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className="truncate font-heading text-[0.75rem] font-bold uppercase tracking-[0.16em] text-white">
                Distribuidora MZ
              </p>
              <p className="truncate text-[0.72rem] font-medium text-white/70">
                Gestión comercial
              </p>
            </div>
          )}
        </div>
        {expanded && headerAction}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navegación principal"
        className="mt-4 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const isModuleExpanded = expandedModules.includes(item.id)
          const isActiveModule = hasChildren && isItemOrDescendantActive(item, location.pathname)
          const showChildren = hasChildren && isModuleExpanded

          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  title={!expanded ? item.name : undefined}
                  aria-label={!expanded ? item.name : undefined}
                  aria-expanded={expanded ? isModuleExpanded : false}
                  onClick={() => {
                    if (!expanded) {
                      onExpandRequest?.()
                      if (!isModuleExpanded) onToggleModule?.(item.id)
                      return
                    }
                    onToggleModule?.(item.id)
                  }}
                  className={cn(
                    'group relative flex w-full cursor-pointer items-center rounded-xl border py-2 transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    expanded ? 'justify-start gap-2.5 px-2.5' : 'justify-center px-1',
                    isActiveModule
                      ? 'border-white/20 bg-white/15 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]'
                      : 'border-transparent bg-transparent text-white/85 hover:border-white/15 hover:bg-white/12 hover:text-white',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
                      isActiveModule
                        ? 'bg-white text-sidebar-primary-foreground shadow-xs dark:bg-sidebar-primary dark:text-sidebar-primary-foreground'
                        : 'bg-white/10 text-white/80 group-hover:bg-white/16 group-hover:text-white',
                    )}
                  >
                    {Icon && <Icon className="size-4" aria-hidden="true" />}
                  </div>
                  {expanded && (
                    <>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[0.84rem] font-semibold leading-tight text-white">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 truncate text-[0.68rem] text-white/75">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          'size-4 shrink-0 text-white/55 transition-transform duration-150',
                          isModuleExpanded && 'rotate-90 text-white',
                        )}
                      />
                    </>
                  )}
                </button>

                {showChildren && expanded && (
                  <SubItems
                    items={item.children}
                    expanded={expanded}
                    onNavigate={onNavigate}
                    expandedModules={expandedModules}
                    onToggleModule={onToggleModule}
                    parentPath={`/${item.path}`}
                    depth={0}
                  />
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.id}
              to={`/${item.path}`}
              title={!expanded ? item.name : undefined}
              aria-label={!expanded ? item.name : undefined}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center rounded-xl border py-2 transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  expanded ? 'justify-start gap-2.5 px-2.5' : 'justify-center px-1',
                  isActive
                    ? 'border-white/25 bg-white/18 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]'
                    : 'border-transparent bg-transparent text-white/85 hover:border-white/15 hover:bg-white/12 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
                      isActive
                        ? 'bg-white text-sidebar-primary-foreground shadow-xs dark:bg-sidebar-primary dark:text-sidebar-primary-foreground'
                        : 'bg-white/10 text-white/80 group-hover:bg-white/16 group-hover:text-white',
                    )}
                  >
                    {Icon && <Icon className="size-4" aria-hidden="true" />}
                  </div>
                  {expanded && (
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[0.84rem] font-semibold leading-tight text-white">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 truncate text-[0.68rem] text-white/75">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

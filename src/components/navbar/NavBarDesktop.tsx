import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import logoImage from '@/assets/logo.jpg'
import type { SidebarItem } from '@/lib/app-routes'

type NavBarDesktopProps = {
  items: SidebarItem[]
  expanded?: boolean
  onNavigate?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
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

/** Sub-items de un módulo expandido, con la línea guía que marca la jerarquía activa. */
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
  const guideLeft = `${4 + depth * 12}px`
  const connectorWidth = `${8}px`

  const hasActiveInLevel = items.some((item) => {
    const fullPath = buildFullPath(item, parentPath)
    const isActive = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)
    if (isActive) return true
    if (item.children.length > 0) {
      const checkDesc = (children: SidebarItem[], pp: string): boolean => {
        return children.some((c) => {
          const cp = buildFullPath(c, pp)
          if (location.pathname === cp || location.pathname.startsWith(`${cp}/`)) return true
          return c.children.length > 0 && checkDesc(c.children, cp)
        })
      }
      if (checkDesc(item.children, fullPath)) return true
    }
    return false
  })

  return (
    <div className={cn('relative ml-3', depth > 0 && 'mt-1')}>
      {/* Línea guía vertical */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-0.5 rounded-full transition-colors duration-150',
          hasActiveInLevel ? 'bg-sidebar-primary' : 'bg-sidebar-border',
        )}
        style={{ left: guideLeft }}
      />

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const fullPath = buildFullPath(item, parentPath)
          const isLeaf = !!item.lazy && !hasChildren
          const isItemExpanded = expandedModules?.includes(item.id) ?? false
          const isActiveItem = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)

          const lineClass = isActiveItem ? 'bg-sidebar-primary' : 'bg-sidebar-border'
          const dotClass = isActiveItem ? 'bg-sidebar-primary' : 'bg-sidebar-border'
          const textClass = isActiveItem ? 'text-sidebar-foreground font-semibold text-xs' : 'text-sidebar-foreground/65 group-hover:text-sidebar-foreground text-xs'
          const iconClass = isActiveItem ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70'

          if (isLeaf) {
            return (
              <NavLink
                key={item.id}
                to={fullPath}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-1 rounded-lg border border-sidebar-border px-5 py-0.5 transition-[background-color,border-color,color] duration-150 ease-out',
                    'bg-sidebar-accent/25',
                    isActive && 'bg-sidebar-primary/20', textClass

                  )
                }
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-150', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

                {Icon && (
                  <div className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                    iconClass,
                  )}>
                    <Icon className="size-3" />
                  </div>
                )}
                {!Icon && (
                  <span className={cn(
                    'mt-px size-1 shrink-0 rounded-full transition-colors duration-150',
                    dotClass,
                  )} />
                )}
                <div className="min-w-0 flex-1">
                  <span className={cn(
                    'block truncate transition-colors duration-150',
                    textClass,
                  )}>
                    {item.name}
                  </span>
                  {/* {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-muted-foreground mt-0.5">
                      {item.description}
                    </span>
                  )} */}
                </div>
              </NavLink>
            )
          }

          // Seccion intermedia
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onToggleModule?.(item.id)}
                className={cn(
                  'group relative flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-2 py-1.5 transition-[background-color,border-color,color] duration-150 ease-out',
                  'hover:bg-sidebar-accent/60',
                  isActiveItem && 'bg-sidebar-primary/20',

                )}
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-150', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

                {Icon && (
                  <div className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                    iconClass,
                  )}>
                    <Icon className="size-3" />
                  </div>
                )}
                {!Icon && (
                  <span className={cn(
                    'mt-px size-1 shrink-0 rounded-full transition-colors duration-150',
                    dotClass,
                  )} />
                )}
                <div className="min-w-0 flex-1 text-left">
                  <span className={cn(
                    'block truncate transition-colors duration-150',
                    textClass,
                  )}>
                    {item.name}
                  </span>
                  {/* {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-muted-foreground mt-0.5">
                      {item.description}
                    </span>
                  )} */}
                </div>
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
  expandedModules = [],
  onToggleModule,
}: NavBarDesktopProps) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div
        className={cn(
          'flex items-center rounded-xl border border-white/15 bg-primary-complement py-3 text-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ease-out',
          expanded ? 'justify-start gap-3 px-4' : 'justify-center px-3',
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 ring-1 ring-white/10">
          <img src={logoImage} alt="Logo del cliente" className="h-full w-full object-contain p-1" />
        </div>
        <div
          className={cn(
            'overflow-hidden transition-[opacity,transform] duration-150 ease-out',
            expanded ? 'w-40 translate-x-0 opacity-100' : 'w-0 -translate-x-1 opacity-0',
          )}
        >
          <div className="flex flex-col justify-center gap-0.5 overflow-hidden">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-secondary leading-none">
              Distribuidora MZ
            </p>
            <p className="text-[0.78rem] font-medium text-white/75 leading-tight">
              Gestión de ventas
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const isModuleExpanded = expandedModules.includes(item.id)
          const isActiveModule = hasChildren && isItemOrDescendantActive(item, location.pathname)
          const showChildren = hasChildren && isModuleExpanded

          // Modulo nivel raiz
          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onToggleModule?.(item.id)}
                  className={cn(
                    'flex w-full items-center rounded-xl border py-1.5 transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.99]',
                    expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                    isActiveModule
                      ? 'border-sidebar-primary/40 bg-sidebar-accent shadow-sm'
                      : 'border-sidebar-border bg-transparent text-sidebar-foreground/65 hover:border-sidebar-primary/30 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                >
                  <>
                    <div
                      className={cn(
                        'rounded-xl p-2 transition-[background-color,color,box-shadow] duration-150 ease-out',
                        isActiveModule ? 'bg-sidebar-primary/25 ring-1 ring-sidebar-primary/30' : 'bg-sidebar-accent/60',
                      )}
                    >
                      {Icon && <Icon className={cn('size-4', isActiveModule ? 'text-sidebar-primary' : 'text-sidebar-foreground/60')} />}
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden transition-[opacity,transform] duration-150 ease-out',
                        expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-1 opacity-0',
                      )}
                    >
                      <p className={cn('text-sm font-semibold whitespace-nowrap', isActiveModule ? 'text-sidebar-primary' : 'text-sidebar-foreground')}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className={cn('text-[0.7rem] whitespace-nowrap', isActiveModule ? 'text-sidebar-primary/80' : 'text-sidebar-foreground/55')}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
                </button>

                {/* Hijos como sub-items */}
                {showChildren && expanded && (
                  <div className="overflow-hidden pl-3">
                    <SubItems
                      items={item.children}
                      expanded={expanded}
                      onNavigate={onNavigate}
                      expandedModules={expandedModules}
                      onToggleModule={onToggleModule}
                      parentPath={`/${item.path}`}
                      depth={0}
                    />
                  </div>
                )}
              </div>
            )
          }

          // Pagina simple
          return (
            <NavLink
              key={item.id}
              to={`/${item.path}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-xl border py-1.5 transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.99]',
                  expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                  isActive
                    ? 'border-sidebar-primary/40 bg-sidebar-accent shadow-sm'
                    : 'border-sidebar-border bg-transparent text-sidebar-foreground/65 hover:border-sidebar-primary/30 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'rounded-xl p-2 transition-[background-color,color,box-shadow] duration-150 ease-out',
                      isActive ? 'bg-sidebar-primary/25 ring-1 ring-sidebar-primary/30' : 'bg-sidebar-accent/60',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/60')} />}
                  </div>
                  <div
                    className={cn(
                      'overflow-hidden transition-[opacity,transform] duration-150 ease-out',
                      expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-1 opacity-0',
                    )}
                  >
                    <p className={cn('text-sm font-semibold whitespace-nowrap', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground')}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={cn('text-[0.7rem] whitespace-nowrap', isActive ? 'text-sidebar-primary/80' : 'text-sidebar-foreground/55')}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

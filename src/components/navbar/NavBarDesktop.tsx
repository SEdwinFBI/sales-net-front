import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import type { SidebarItem } from '@/lib/app-routes'

type NavBarDesktopProps = {
  items: SidebarItem[]
  expanded?: boolean
  onNavigate?: () => void
  expandedModules?: string[]
  onToggleModule?: (moduleId: string) => void
}

/** Construye la ruta */
function buildFullPath(item: SidebarItem, parentPath?: string): string {
  const currentPath = parentPath ? `${parentPath}/${item.path}` : `/${item.path}`
  return currentPath
}

/** Verifica  */
function isItemOrDescendantActive(item: SidebarItem, currentPathname: string, parentPath?: string): boolean {
  const fullPath = buildFullPath(item, parentPath)
  if (currentPathname === fullPath || currentPathname.startsWith(`${fullPath}/`)) return true
  return item.children.some((child) => isItemOrDescendantActive(child, currentPathname, fullPath))
}

/** Renderiza los hijos*/
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
          'absolute top-0 bottom-0 w-0.5 rounded-full transition-colors duration-200',
          hasActiveInLevel ? 'bg-primary' : 'bg-stone-500',
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

          const lineClass = isActiveItem ? 'bg-primary' : 'bg-stone-500'
          const dotClass = isActiveItem ? 'bg-primary' : 'bg-stone-300/90'
          const textClass = isActiveItem ? 'text-stone-700 font-semibold text-[0.73rem]' : 'text-stone-500 group-hover:text-stone-600 text-[0.73rem]'
          const iconClass = isActiveItem ? 'text-primary/90' : 'text-stone-400 group-hover:text-stone-500'

          if (isLeaf) {
            return (
              <NavLink
                key={item.id}
                to={fullPath}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative border border-s-olive-200 flex items-center gap-1 rounded-lg px-5 py-0.5 transition-all duration-200 ease-out',
                    'bg-stone-100/20',
                    isActive && 'bg-primary/8', textClass

                  )
                }
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-200', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

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
                    'size-1 shrink-0 rounded-full mt-px transition-colors duration-150',
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
                    <span className="block truncate text-[0.63rem] text-stone-400 mt-0.5">
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
                  'group relative flex border border-stone-200 w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200 ease-out',
                  'hover:bg-white/3',
                  isActiveItem && 'bg-primary/8',

                )}
              >
                {/* Conector horizontal */}
                <div className={cn('absolute top-1/2 h-0.5 rounded-full transition-colors duration-200', lineClass)} style={{ left: guideLeft, width: connectorWidth }} />

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
                    'size-1 shrink-0 rounded-full mt-px transition-colors duration-150',
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
                    <span className="block truncate text-[0.63rem] text-stone-400 mt-0.5">
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
          'flex items-center rounded-2xl max-h-15 border border-white/15 bg-linear-to-br from-primary to-primary/85 py-2.5 text-white shadow-[0_4px_16px_-4px_rgba(53,37,205,0.25),0_0_0_1px_rgba(53,37,205,0.1)] transition-all duration-200 ease-out',
          expanded ? 'justify-start gap-3 px-4' : 'justify-center px-3',
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black uppercase tracking-widest text-amber-300/90 ring-1 ring-white/5">
          SN
        </div>
        <div
          className={cn(
            'overflow-hidden transition-[width,opacity,transform] duration-200 ease-out',
            expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
          )}
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-secondary">
            Sales Net
          </p>
          <p className="mt-1 text-xs text-white/60">
            Panel comercial
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex flex-col gap-1">
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
                    'flex w-full items-center rounded-2xl border py-1.5 transition-all duration-300 ease-out active:scale-[0.98]',
                    expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                    isActiveModule
                      ? 'border-primary/20 bg-primary/8 shadow-[0_0_16px_-4px_rgba(99,102,241,0.15)]'
                      : 'border-stone-200 bg-transparent text-stone-500 hover:border-stone-200/60 hover:bg-white/70 hover:text-stone-700 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]',
                  )}
                >
                  <>
                    <div
                      className={cn(
                        'rounded-xl p-2 transition-all duration-300 ease-out',
                        isActiveModule ? 'bg-primary/12 ring-1 ring-primary/15' : 'bg-stone-100',
                        expanded && 'hover:scale-105',
                      )}
                    >
                      {Icon && <Icon className={cn('size-4', isActiveModule ? 'text-primary' : 'text-stone-500')} />}
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden transition-[width,opacity,transform] duration-300 ease-out',
                        expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                      )}
                    >
                      <p className={cn('text-sm font-semibold whitespace-nowrap', isActiveModule ? 'text-primary' : 'text-stone-700')}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className={cn('text-[0.7rem] whitespace-nowrap', isActiveModule ? 'text-primary/75' : 'text-stone-400')}>
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
                  'flex items-center rounded-2xl border py-1.5 transition-all duration-300 ease-out active:scale-[0.98]',
                  expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                  isActive
                    ? 'border-primary/20 bg-primary/8 shadow-[0_0_16px_-4px_rgba(99,102,241,0.15)]'
                    : 'border-stone-200 bg-transparent text-stone-500 hover:border-stone-200/60 hover:bg-white/70 hover:text-stone-700 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'rounded-xl p-2 transition-all duration-300 ease-out',
                      isActive ? 'bg-primary/12 ring-1 ring-primary/15' : 'bg-stone-100',
                      expanded && 'hover:scale-105',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-stone-500')} />}
                  </div>
                  <div
                    className={cn(
                      'overflow-hidden transition-[width,opacity,transform] duration-300 ease-out',
                      expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                    )}
                  >
                    <p className={cn('text-sm font-semibold whitespace-nowrap', isActive ? 'text-primary' : 'text-stone-700')}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={cn('text-[0.7rem] whitespace-nowrap', isActive ? 'text-primary/75' : 'text-stone-400')}>
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

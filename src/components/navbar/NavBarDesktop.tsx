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

/** Construye la ruta completa desde el item raiz hasta el hijo */
function buildFullPath(item: SidebarItem, parentPath?: string): string {
  const currentPath = parentPath ? `${parentPath}/${item.path}` : `/${item.path}`
  return currentPath
}

/** Verifica si la ruta actual pertenece a este item o a alguno de sus descendientes */
function isItemOrDescendantActive(item: SidebarItem, currentPathname: string, parentPath?: string): boolean {
  const fullPath = buildFullPath(item, parentPath)
  if (currentPathname === fullPath || currentPathname.startsWith(`${fullPath}/`)) return true
  return item.children.some((child) => isItemOrDescendantActive(child, currentPathname, fullPath))
}

/** Renderiza los hijos recursivamente como sub-items */
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
          hasActiveInLevel ? 'bg-primary/30' : 'bg-neutral/10',
        )}
        style={{ left: guideLeft }}
      />

      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children.length > 0
          const fullPath = buildFullPath(item, parentPath)
          const isLeaf = !!item.lazy && !hasChildren
          const isItemExpanded = expandedModules?.includes(item.id) ?? false
          const isActiveItem = location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)

          const lineClass = isActiveItem ? 'bg-primary' : 'bg-neutral/15'
          const dotClass = isActiveItem ? 'bg-primary' : 'bg-neutral/20'
          const textClass = isActiveItem ? 'text-neutral font-semibold text-[0.73rem]' : 'text-neutral/75 group-hover:text-neutral text-[0.73rem]'
          const iconClass = isActiveItem ? 'text-primary' : 'text-neutral/40 group-hover:text-neutral/60'

          if (isLeaf) {
            return (
              <NavLink
                key={item.id}
                to={fullPath}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-150 ease-out',
                    'hover:bg-black/4',
                    isActive && 'bg-primary/[0.07]', textClass

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
                  {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-neutral/40 mt-0.5">
                      {item.description}
                    </span>
                  )}
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
                  'group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-150 ease-out',
                  'hover:bg-black/4',
                  isActiveItem && 'bg-primary/[0.07]',

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
                  {item.description && depth === 0 && (
                    <span className="block truncate text-[0.63rem] text-neutral/40 mt-0.5">
                      {item.description}
                    </span>
                  )}
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
          'flex items-center rounded-[1.5rem] max-h-15 border border-white/10 bg-primary py-2 text-white shadow-[0_18px_42px_-26px_rgba(53,37,205,0.58)] transition-[padding,gap,justify-content] duration-220 ease-out',
          expanded ? 'justify-start gap-3 px-4' : 'justify-center px-3',
        )}
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-[1rem] bg-white/14 text-[0.72rem] font-black uppercase tracking-[0.24em] text-secondary">
          SN
        </div>
        <div
          className={cn(
            'overflow-hidden transition-[width,opacity,transform] duration-220 ease-out',
            expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
          )}
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-secondary">
            Sales Net
          </p>
          <p className="mt-1 text-xs text-white/74">
            Panel comercial
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-col gap-2">
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
                    'flex w-full items-center rounded-[1.25rem] border py-4 transition-[background-color,border-color,box-shadow,transform,gap,justify-content,padding] duration-220 ease-out hover:-translate-y-0.5',
                    expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                    isActiveModule
                      ? 'border-primary/18 bg-primary/10 shadow-[0_14px_30px_-24px_rgba(53,37,205,0.55)]'
                      : 'border-neutral/5 bg-neutral/5 text-neutral hover:border-primary/18 hover:bg-white/92 hover:shadow-[0_14px_28px_-24px_rgba(70,69,85,0.24)]',
                  )}
                >
                  <>
                    <div
                      className={cn(
                        'rounded-full p-2.5 transition-[background-color,transform] duration-220 ease-out',
                        isActiveModule ? 'bg-primary/12' : 'bg-secondary',
                        expanded && 'hover:scale-[1.03]',
                      )}
                    >
                      {Icon && <Icon className={cn('size-4', isActiveModule ? 'text-primary' : 'text-neutral')} />}
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden transition-[width,opacity,transform] duration-220 ease-out',
                        expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                      )}
                    >
                      <p className={cn('text-sm font-semibold whitespace-nowrap', isActiveModule ? 'text-primary' : 'text-neutral')}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className={cn('text-[0.7rem] whitespace-nowrap', isActiveModule ? 'text-primary/75' : 'text-neutral/70')}>
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

          // Pagina simple sin hijos
          return (
            <NavLink
              key={item.id}
              to={`/${item.path}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-[1.25rem] border py-4 transition-[background-color,border-color,box-shadow,transform,gap,justify-content,padding] duration-220 ease-out hover:-translate-y-0.5',
                  expanded ? 'justify-start gap-3 px-3.5' : 'justify-center gap-0 px-1',
                  isActive
                    ? 'border-primary/18 bg-primary/10 shadow-[0_14px_30px_-24px_rgba(53,37,205,0.55)]'
                    : 'border-white/70 bg-white/72 text-neutral hover:border-primary/18 hover:bg-white/92 hover:shadow-[0_14px_28px_-24px_rgba(70,69,85,0.24)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'rounded-full p-2.5 transition-[background-color,transform] duration-220 ease-out',
                      isActive ? 'bg-primary/12' : 'bg-secondary',
                      expanded && 'hover:scale-[1.03]',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-neutral')} />}
                  </div>
                  <div
                    className={cn(
                      'overflow-hidden transition-[width,opacity,transform] duration-220 ease-out',
                      expanded ? 'w-32 translate-x-0 opacity-100' : 'w-0 -translate-x-2 opacity-0',
                    )}
                  >
                    <p className={cn('text-sm font-semibold whitespace-nowrap', isActive ? 'text-primary' : 'text-neutral')}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={cn('text-[0.7rem] whitespace-nowrap', isActive ? 'text-primary/75' : 'text-neutral/70')}>
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

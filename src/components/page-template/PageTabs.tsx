import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export type PageTabItem = {
  id: string
  label: string
  to: string
}

type PageTabsProps = {
  tabs: PageTabItem[]
}

export default function PageTabs({ tabs }: PageTabsProps) {
  if (!tabs.length) {
    return null
  }

  return (
    <div className="mb-4 overflow-x-auto pb-1 md:hidden">
      <div className="inline-flex gap-1.5 rounded-xl border border-border/70 bg-card p-1 shadow-xs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary font-semibold text-primary-foreground shadow-2xs'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

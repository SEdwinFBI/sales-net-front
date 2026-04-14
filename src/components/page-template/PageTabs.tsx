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
    <div className="-mx-6 -mt-2 mb-6 border-b border-secondary px-6 md:hidden">
      <div className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-1 py-3 text-sm transition-colors',
                isActive
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-neutral/70',
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

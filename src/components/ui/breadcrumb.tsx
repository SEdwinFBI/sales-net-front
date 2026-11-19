import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className={cn('flex flex-wrap items-center gap-1 text-xs text-muted-foreground', className)}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 opacity-45" aria-hidden="true" />}
          {item.href ? (
            <Link
              to={item.href}
              className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-1 font-semibold text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

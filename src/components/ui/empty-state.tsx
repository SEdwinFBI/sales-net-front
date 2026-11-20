import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon?: LucideIcon
  title?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'px-6 py-7 text-sm',
  md: 'px-8 py-11 sm:px-12',
  lg: 'px-10 py-14 sm:px-16',
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border/90 bg-muted/25 text-center text-muted-foreground',
        sizeMap[size],
        className,
      )}
    >
      {Icon && (
        <div className="mb-0.5 flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-card text-muted-foreground/75 shadow-xs">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      {title && <p className="text-sm font-semibold text-foreground/85">{title}</p>}
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}

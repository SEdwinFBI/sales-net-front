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
  sm: 'p-6 text-sm',
  md: 'p-10 sm:p-12',
  lg: 'p-14 sm:p-16',
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
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center text-muted-foreground',
        sizeMap[size],
        className,
      )}
    >
      {Icon && <Icon className="size-8 opacity-40" aria-hidden="true" />}
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && <p className="text-xs">{description}</p>}
    </div>
  )
}

'use no memo';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  /** Página actual (1-based) */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/** Ventana de hasta 5 números de página centrada en la actual (1-based). */
export function getVisiblePages(page: number, totalPages: number): number[] {
  const maxVisible = 5
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  let start = page - Math.floor(maxVisible / 2)
  start = Math.max(1, Math.min(start, totalPages - maxVisible + 1))
  return Array.from({ length: maxVisible }, (_, i) => start + i)
}

/**
 * Paginador de botones puros (sin anchors): primera/anterior, ventana de
 * números centrada, siguiente/última y contador de páginas.
 */
export default function Paginator({ page, totalPages, onPageChange, className }: Props) {
  if (totalPages <= 0) return null

  const current = Math.min(Math.max(1, page), totalPages)
  const isFirst = current <= 1
  const isLast = current >= totalPages

  const go = (target: number) => {
    const next = Math.min(Math.max(1, target), totalPages)
    if (next !== current) onPageChange(next)
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-1 sm:justify-end', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Primera página"
        disabled={isFirst}
        onClick={() => go(1)}
      >
        <ChevronsLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Página anterior"
        disabled={isFirst}
        onClick={() => go(current - 1)}
      >
        <ChevronLeft />
      </Button>

      {getVisiblePages(current, totalPages).map((p) => (
        <Button
          key={p}
          type="button"
          variant={p === current ? 'default' : 'ghost'}
          size="icon-sm"
          aria-label={`Página ${p}`}
          aria-current={p === current ? 'page' : undefined}
          onClick={() => go(p)}
          className="tabular-nums"
        >
          {p}
        </Button>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Página siguiente"
        disabled={isLast}
        onClick={() => go(current + 1)}
      >
        <ChevronRight />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Última página"
        disabled={isLast}
        onClick={() => go(totalPages)}
      >
        <ChevronsRight />
      </Button>

      <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
        Página {current} de {totalPages}
      </span>
    </div>
  )
}

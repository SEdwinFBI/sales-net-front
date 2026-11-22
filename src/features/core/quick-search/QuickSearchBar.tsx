import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { QuickSearchSource, QuickSearchSourceId } from './quick-search-config'
import QuickSearchDrawer from './QuickSearchDrawer'

type Props = {
  sources: QuickSearchSource[]
  className?: string
}

/**
 * Accesos directos de búsqueda del header. En el teléfono, ícono con la etiqueta debajo (como una
 * barra de pestañas, para que quepan tres); desde `sm`, ícono y etiqueta en línea.
 */
export default function QuickSearchBar({ sources, className }: Props) {
  const [open, setOpen] = useState(false)
  const [sourceId, setSourceId] = useState<QuickSearchSourceId>(sources[0]?.id ?? 'clientes')

  if (sources.length === 0) return null

  const abrir = (id: QuickSearchSourceId) => {
    setSourceId(id)
    setOpen(true)
  }

  return (
    <>
      <nav aria-label="Busqueda rapida" className={cn('flex min-w-0 items-center gap-1 sm:gap-1.5', className)}>
        {sources.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => abrir(source.id)}
            aria-label={`Buscar ${source.label.toLowerCase()}`}
            title={`Buscar ${source.label.toLowerCase()}`}
            className="inline-flex min-w-14 cursor-pointer flex-col items-center gap-0.5 rounded-xl border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-accent/70 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:min-w-0 sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs"
          >
            <source.icon className="size-4 text-primary" aria-hidden="true" />
            <span className="leading-none">{source.label}</span>
          </button>
        ))}
      </nav>

      <QuickSearchDrawer
        open={open}
        onOpenChange={setOpen}
        sources={sources}
        sourceId={sourceId}
        onSourceChange={setSourceId}
      />
    </>
  )
}

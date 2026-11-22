import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { QuickSearchSource, QuickSearchSourceId } from './quick-search-config'
import QuickSearchDrawer from './QuickSearchDrawer'

type Props = {
  sources: QuickSearchSource[]
  rutas: ReadonlySet<string>
  className?: string
}

/**
 * Accesos rápidos de búsqueda del header: solo íconos (el nombre va como texto accesible y en la
 * ayuda al pasar el mouse) bajo un título pequeño, para que quepan todos sin desplazamiento.
 */
export default function QuickSearchBar({ sources, rutas, className }: Props) {
  const [open, setOpen] = useState(false)
  const [sourceId, setSourceId] = useState<QuickSearchSourceId>(sources[0]?.id ?? 'clientes')

  if (sources.length === 0) return null

  const abrir = (id: QuickSearchSourceId) => {
    setSourceId(id)
    setOpen(true)
  }

  return (
    <>
      <nav aria-labelledby="accesos-rapidos" className={cn('min-w-0', className)}>
        <p id="accesos-rapidos" className="text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-primary">
          Accesos rápidos
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => abrir(source.id)}
              aria-label={`Buscar ${source.label.toLowerCase()}`}
              title={`Buscar ${source.label.toLowerCase()}`}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/70 bg-background/70 text-primary transition-colors hover:border-primary/35 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              <source.icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </nav>

      <QuickSearchDrawer
        open={open}
        onOpenChange={setOpen}
        sources={sources}
        rutas={rutas}
        sourceId={sourceId}
        onSourceChange={setSourceId}
      />
    </>
  )
}

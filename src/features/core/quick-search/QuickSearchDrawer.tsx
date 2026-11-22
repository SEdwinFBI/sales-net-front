import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Loader2, Search } from 'lucide-react'

import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

import { MIN_CHARS, type QuickSearchSource, type QuickSearchSourceId } from './quick-search-config'

/** Espera tras la última tecla antes de consultar al servidor. */
const DEBOUNCE_MS = 300

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sources: QuickSearchSource[]
  sourceId: QuickSearchSourceId
  onSourceChange: (id: QuickSearchSourceId) => void
}

export default function QuickSearchDrawer({ open, onOpenChange, sources, sourceId, onSourceChange }: Props) {
  const navigate = useNavigate()
  const source = sources.find((s) => s.id === sourceId) ?? sources[0]
  const [texto, setTexto] = useState('')
  const [buscado, setBuscado] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscado(texto.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [texto])

  const habilitado = open && Boolean(source) && buscado.length >= MIN_CHARS
  const { data: resultados = [], isFetching, isError } = useQuery({
    queryKey: ['quick-search', source?.id, buscado],
    queryFn: () => (source ? source.search(buscado) : Promise.resolve([])),
    enabled: habilitado,
    staleTime: 30_000,
  })

  if (!source) return null

  // Al cerrar se vacía, para que la próxima vez empiece de cero.
  const cambiarApertura = (next: boolean) => {
    if (!next) {
      setTexto('')
      setBuscado('')
    }
    onOpenChange(next)
  }

  const abrir = (ruta: string) => {
    cambiarApertura(false)
    navigate(ruta)
  }

  return (
    <Drawer open={open} onOpenChange={cambiarApertura}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="gap-3 px-4 pt-3 pb-3">
          <DrawerTitle className="sr-only">Buscar {source.label.toLowerCase()}</DrawerTitle>
          <DrawerDescription className="sr-only">Escribe para buscar y toca un resultado para abrirlo.</DrawerDescription>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:ring-3 focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder={source.placeholder}
              aria-label={source.placeholder}
              maxLength={80}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
            />
            {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />}
          </label>
          {sources.length > 1 && (
            <div role="tablist" aria-label="Que buscar" className="flex gap-1.5 overflow-x-auto">
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === source.id}
                  onClick={() => onSourceChange(s.id)}
                  className={cn(
                    'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    s.id === source.id
                      ? 'border-primary/40 bg-primary/12 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <s.icon className="size-3.5" aria-hidden="true" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </DrawerHeader>

        <DrawerBody className="min-h-48 px-2 py-2" aria-live="polite">
          {buscado.length < MIN_CHARS ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribe al menos {MIN_CHARS} letras.</p>
          ) : isError ? (
            <p className="px-3 py-6 text-center text-sm text-destructive">No se pudo buscar. Intenta de nuevo.</p>
          ) : resultados.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {isFetching ? 'Buscando...' : 'Sin resultados.'}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {resultados.map((resultado) => (
                <li key={resultado.id}>
                  <button
                    type="button"
                    onClick={() => abrir(resultado.ruta)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{resultado.titulo}</span>
                      {resultado.detalle && (
                        <span className="block truncate text-xs text-muted-foreground">{resultado.detalle}</span>
                      )}
                    </span>
                    {resultado.aviso && (
                      <span className="shrink-0 text-xs font-semibold text-destructive">{resultado.aviso}</span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

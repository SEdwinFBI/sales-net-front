import { useState } from 'react'
import { Loader2, MoveRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Sucursal } from '@/features/auth/types/auth'

type SucursalPickerProps = {
  sucursales: Sucursal[]
  onSelect: (sucursalId: number) => Promise<void>
}

export default function SucursalPicker({ sucursales, onSelect }: SucursalPickerProps) {
  const [seleccionandoId, setSeleccionandoId] = useState<number | null>(null)

  const handleSelect = async (id: number) => {
    if (seleccionandoId !== null) return
    setSeleccionandoId(id)
    try {
      await onSelect(id)
    } finally {
      setSeleccionandoId(null)
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Elige tu sucursal
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tu usuario pertenece a más de una sucursal. Selecciona con cuál vas a trabajar hoy.
        </p>
      </div>

      <div className="mt-6 space-y-2.5">
        {sucursales.map((sucursal) => {
          const isLoading = seleccionandoId === sucursal.id
          return (
            <Button
              key={sucursal.id}
              type="button"
              variant="outline"
              size="lg"
              className="group/branch h-auto min-h-14 w-full justify-between rounded-2xl border-border/90 bg-muted/25 px-3.5 py-3 text-left font-semibold transition-all hover:border-primary/45 hover:bg-primary/[0.06] hover:shadow-xs"
              disabled={seleccionandoId !== null}
              onClick={() => handleSelect(sucursal.id)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover/branch:bg-primary group-hover/branch:text-primary-foreground">
                  <Store className="size-4" aria-hidden="true" />
                </span>
                <span className="truncate">{sucursal.nombre}</span>
              </span>
              {isLoading ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <MoveRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/branch:translate-x-1 group-hover/branch:text-primary"
                  aria-hidden="true"
                />
              )}
            </Button>
          )
        })}
      </div>
    </>
  )
}

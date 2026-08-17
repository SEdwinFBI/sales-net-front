import { useState } from 'react'
import { Loader2, MoveRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RotateHover from '@/components/motion/RotateHover'
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
        <h1 className="font-heading text-2xl font-semibold text-neutral">
          Elige tu sucursal
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu usuario pertenece a más de una sucursal. Selecciona con cuál vas a trabajar.
        </p>
      </div>

      <div className="mt-7 space-y-3">
        {sucursales.map((sucursal) => {
          const isLoading = seleccionandoId === sucursal.id
          return (
            <RotateHover key={sucursal.id} rotate={0.5}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-between font-semibold!"
                disabled={seleccionandoId !== null}
                onClick={() => handleSelect(sucursal.id)}
              >
                <span className="flex items-center gap-2">
                  <Store className="size-4" />
                  {sucursal.nombre}
                </span>
                {isLoading ? <Loader2 className="animate-spin" /> : <MoveRight />}
              </Button>
            </RotateHover>
          )
        })}
      </div>
    </>
  )
}

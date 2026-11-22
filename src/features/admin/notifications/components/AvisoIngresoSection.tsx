import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-error'

import { activarPush, desactivarPush, estadoPush, type EstadoPush } from '../services/push-service'

const NOTA: Partial<Record<EstadoPush, string>> = {
  no_soportado: 'Disponible en la app instalada en el teléfono.',
  sin_configurar: 'Falta configurar las claves de avisos en el servidor.',
  bloqueado: 'Las notificaciones están bloqueadas. Actívalas en los ajustes del teléfono para esta app.',
}

/** Aviso push en este teléfono cuando un vendedor con transmisión de audio entra al sistema. */
export default function AvisoIngresoSection() {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    estadoPush().then(setEstado, () => setEstado('no_soportado'))
  }, [])

  const cambiar = async (activar: boolean) => {
    setGuardando(true)
    try {
      const nuevo = activar ? await activarPush() : await desactivarPush()
      setEstado(nuevo)
      if (nuevo === 'activo') toast.success('Avisos activados en este teléfono')
      else if (!activar) toast.success('Avisos desactivados en este teléfono')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron cambiar los avisos'))
    } finally {
      setGuardando(false)
    }
  }

  const nota = estado ? NOTA[estado] : undefined
  const disponible = estado === 'activo' || estado === 'inactivo'

  return (
    <section aria-labelledby="aviso-ingreso-title" className="flex items-start gap-3">
      <Smartphone aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <h2 id="aviso-ingreso-title" className="text-sm font-semibold">Avisarme cuando un vendedor entra</h2>
        <p className="text-xs text-muted-foreground">
          {nota ?? 'Notificación en este teléfono, aunque la app esté cerrada. Solo vendedores con transmisión de audio.'}
        </p>
      </div>
      <Switch
        checked={estado === 'activo'}
        disabled={!disponible || guardando}
        aria-label="Avisarme cuando un vendedor entra"
        onCheckedChange={cambiar}
      />
    </section>
  )
}

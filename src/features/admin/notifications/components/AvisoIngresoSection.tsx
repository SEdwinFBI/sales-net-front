import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-error'

import { activarPush, desactivarPush, estadoPush, type EstadoPush } from '../services/push-service'

const NOTA: Partial<Record<EstadoPush, string>> = {
  no_soportado: 'Este navegador no permite avisos, o la página no está en HTTPS.',
  sin_configurar: 'Falta configurar las claves de avisos en el servidor.',
  bloqueado: 'Las notificaciones están bloqueadas en este dispositivo. Actívalas en sus ajustes para esta app.',
}

/** Aviso push en ESTE dispositivo cuando un vendedor con transmisión de audio entra al sistema (se activa en cada uno). */
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
      if (nuevo === 'activo') toast.success('Avisos activados en este dispositivo')
      else if (!activar) toast.success('Avisos desactivados en este dispositivo')
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
        <h2 id="aviso-ingreso-title" className="text-sm font-semibold">Avisarme en este dispositivo cuando un vendedor entra</h2>
        <p className="text-xs text-muted-foreground">
          {nota ?? 'Actívalo en cada teléfono o computadora donde quieras recibir el aviso. Llega aunque la app esté cerrada. Solo vendedores con transmisión de audio.'}
        </p>
      </div>
      <Switch
        checked={estado === 'activo'}
        disabled={!disponible || guardando}
        aria-label="Avisarme en este dispositivo cuando un vendedor entra"
        onCheckedChange={cambiar}
      />
    </section>
  )
}

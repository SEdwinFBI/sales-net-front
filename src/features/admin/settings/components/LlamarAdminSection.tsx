import { useEffect, useState } from 'react'
import { Headphones } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { esperaLlamado, llamarAdministrador } from '@/features/admin/notifications/services/push-service'

const reloj = (segundos: number) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

/**
 * El vendedor avisa a los administradores que lo escuchen (antes de una venta o si necesita ayuda).
 * Una vez cada 5 minutos; el servidor también lo bloquea.
 */
export default function LlamarAdminSection() {
  const [espera, setEspera] = useState(0)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    esperaLlamado().then(setEspera, () => setEspera(0))
  }, [])

  // Cuenta regresiva mientras no se pueda volver a avisar.
  useEffect(() => {
    if (espera <= 0) return
    const timer = window.setTimeout(() => setEspera((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [espera])

  const llamar = async () => {
    setEnviando(true)
    try {
      const { espera: nueva } = await llamarAdministrador()
      setEspera(nueva)
      toast.success('Aviso enviado al administrador')
    } catch (error) {
      const restante = (error as { response?: { data?: { espera?: number } } }).response?.data?.espera
      if (restante) setEspera(restante)
      toast.error(getApiErrorMessage(error, 'No se pudo avisar al administrador'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="llamar-admin-titulo" className="flex items-center gap-3 border-t border-border/70 p-4 sm:px-5">
      <Headphones className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 id="llamar-admin-titulo" className="text-sm font-medium text-foreground">Avisar al administrador</h2>
        <p className="text-xs text-muted-foreground">Le llega una notificación para que te escuche, por ejemplo antes de una venta.</p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={enviando || espera > 0} onClick={() => void llamar()}>
        {enviando ? 'Enviando…' : espera > 0 ? `Disponible en ${reloj(espera)}` : 'Avisar'}
      </Button>
    </section>
  )
}

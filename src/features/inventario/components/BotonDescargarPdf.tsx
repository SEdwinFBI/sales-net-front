import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'

type Props = {
  /** Genera el PDF y solicita abrir su vista de configuración. */
  onDownload: () => Promise<void>
  disabled?: boolean
  label?: string
}

/** Acceso al configurador compartido por las pantallas de inventario. */
export default function BotonDescargarPdf({ onDownload, disabled, label = 'Configurar reporte' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onDownload()
      toast.success('Reporte listo para configurar')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo preparar el reporte'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading || disabled} className="h-9 shrink-0">
      <FileDown />
      {loading ? 'Generando…' : label}
    </Button>
  )
}

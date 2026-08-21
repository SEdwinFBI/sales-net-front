import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'

type Props = {
  /** Debe descargar el PDF; el botón sólo maneja el estado y los avisos. */
  onDownload: () => Promise<void>
  disabled?: boolean
  label?: string
}

/** Botón de descarga compartido por las pantallas de inventario. */
export default function BotonDescargarPdf({ onDownload, disabled, label = 'Descargar PDF' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onDownload()
      toast.success('PDF descargado correctamente')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al descargar el PDF'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading || disabled} className="h-9 shrink-0">
      <FileDown />
      {loading ? 'Descargando…' : label}
    </Button>
  )
}

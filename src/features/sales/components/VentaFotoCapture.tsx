import { useRef, useState } from 'react'
import { Camera, ImageUp, Loader2, RefreshCw, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCameraCapture } from '../hooks/useCameraCapture'
import { formatearPeso } from '../utils/compress-image'

type VentaFotoCaptureProps = {
  /** Data URL de la foto ya tomada, o null si aún no hay. */
  foto: string | null
  onChange: (foto: string | null) => void
}

/**
 * Captura de la foto de entrega. Es obligatoria para cerrar la venta, así que
 * siempre ofrece la alternativa de subir un archivo: si la cámara falla por
 * permisos o hardware, el vendedor no se queda sin poder cobrar.
 */
const VentaFotoCapture = ({ foto, onChange }: VentaFotoCaptureProps) => {
  const { videoRef, camaraActiva, iniciando, error, abrirCamara, cerrarCamara, capturar, capturarArchivo } =
    useCameraCapture()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [peso, setPeso] = useState<number | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)

  const handleCapturar = () => {
    const imagen = capturar()
    if (!imagen) return
    setPeso(imagen.bytes)
    onChange(imagen.dataUrl)
  }

  const handleArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.currentTarget.files?.item(0)
    event.currentTarget.value = ''
    if (!archivo) return

    setErrorArchivo(null)
    try {
      const imagen = await capturarArchivo(archivo)
      setPeso(imagen.bytes)
      onChange(imagen.dataUrl)
    } catch (err) {
      setErrorArchivo(err instanceof Error ? err.message : 'No se pudo procesar la imagen')
    }
  }

  const handleRepetir = () => {
    onChange(null)
    setPeso(null)
    setErrorArchivo(null)
  }

  const mensaje = errorArchivo ?? error

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        Foto de entrega <span className="text-destructive">*</span>
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
        {foto ? (
          <img src={foto} alt="Foto de la entrega" className="max-h-56 w-full object-contain" />
        ) : camaraActiva ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="max-h-56 w-full bg-black object-contain"
          />
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Camera className="size-7" />
            <span className="text-xs">Sin foto todavía</span>
          </div>
        )}
      </div>

      {peso !== null && foto && (
        <p className="mt-1.5 text-xs text-muted-foreground">Peso optimizado: {formatearPeso(peso)}</p>
      )}

      {mensaje && <p className="mt-1.5 text-xs text-warning">{mensaje}</p>}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {foto ? (
          <Button type="button" variant="outline" size="sm" onClick={handleRepetir}>
            <RefreshCw />
            Repetir foto
          </Button>
        ) : camaraActiva ? (
          <>
            <Button type="button" size="sm" onClick={handleCapturar}>
              <Camera />
              Tomar foto
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cerrarCamara}>
              <X />
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" onClick={() => void abrirCamara()} disabled={iniciando}>
              {iniciando ? <Loader2 className="animate-spin" /> : <Camera />}
              {iniciando ? 'Abriendo…' : 'Abrir cámara'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <ImageUp />
              Subir archivo
            </Button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleArchivo(event)}
      />
    </div>
  )
}

export default VentaFotoCapture

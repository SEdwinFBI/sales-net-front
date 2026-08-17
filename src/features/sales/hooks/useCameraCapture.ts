import { useCallback, useEffect, useRef, useState } from 'react'

import { comprimirArchivo, comprimirVideoFrame, type ImagenComprimida } from '../utils/compress-image'

/**
 * Cámara para la foto de entrega del POS.
 *
 * Sigue el mismo contrato de permisos que useSpeechRecognition (secure context,
 * NotAllowedError / NotFoundError / NotReadableError y teardown de los tracks).
 * Como la foto es obligatoria para cobrar, ante cualquier fallo de cámara se
 * expone `puedeUsarArchivo` para que el vendedor no quede bloqueado.
 */

export type CameraCapture = {
  /** Ref a enganchar en el <video> de la vista previa. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** true mientras el stream está activo y se puede disparar. */
  camaraActiva: boolean
  /** true mientras se pide el permiso. */
  iniciando: boolean
  error: string | null
  abrirCamara: () => Promise<void>
  cerrarCamara: () => void
  /** Toma el frame actual, lo comprime y cierra la cámara. */
  capturar: () => ImagenComprimida | null
  /** Comprime un archivo elegido a mano (fallback). */
  capturarArchivo: (archivo: File) => Promise<ImagenComprimida>
}

function esLocalhost(): boolean {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

export function useCameraCapture(): CameraCapture {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [iniciando, setIniciando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cerrarCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamaraActiva(false)
  }, [])

  const abrirCamara = useCallback(async () => {
    setError(null)

    // En un origen inseguro (http:// por IP de LAN, no localhost) el propio
    // navigator.mediaDevices no existe, así que este chequeo va primero: si no,
    // el error genérico de abajo tapa la causa real (falta HTTPS/localhost).
    if (!window.isSecureContext && !esLocalhost()) {
      setError('La cámara requiere HTTPS o localhost.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite usar la cámara.')
      return
    }

    setIniciando(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // environment = cámara trasera en el celular del vendedor.
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      streamRef.current = stream
      // El <video> recién se monta cuando camaraActiva pasa a true (ver
      // VentaFotoCapture), así que todavía no existe en este punto: conectar
      // el stream acá no hace nada. El efecto de abajo lo conecta una vez que
      // ya está en el DOM.
      setCamaraActiva(true)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Puedes subir la foto desde el dispositivo.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No se detectó una cámara. Puedes subir la foto desde el dispositivo.')
      } else if (err instanceof DOMException && err.name === 'NotReadableError') {
        setError('La cámara está en uso por otra app.')
      } else {
        setError('No se pudo acceder a la cámara.')
      }
      cerrarCamara()
    } finally {
      setIniciando(false)
    }
  }, [cerrarCamara])

  const capturar = useCallback((): ImagenComprimida | null => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setError('La cámara aún no está lista.')
      return null
    }

    try {
      const imagen = comprimirVideoFrame(video)
      cerrarCamara()
      return imagen
    } catch {
      setError('No se pudo capturar la foto.')
      return null
    }
  }, [cerrarCamara])

  const capturarArchivo = useCallback(async (archivo: File) => {
    setError(null)
    return comprimirArchivo(archivo)
  }, [])

  // Conecta el stream al <video> apenas queda montado (recién se monta
  // cuando camaraActiva pasa a true), no en abrirCamara donde todavía no existe.
  useEffect(() => {
    if (!camaraActiva) return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    video.srcObject = stream
    video.play().catch(() => undefined)
  }, [camaraActiva])

  // Nunca dejar la cámara encendida al desmontar el diálogo.
  useEffect(() => cerrarCamara, [cerrarCamara])

  return {
    videoRef,
    camaraActiva,
    iniciando,
    error,
    abrirCamara,
    cerrarCamara,
    capturar,
    capturarArchivo,
  }
}

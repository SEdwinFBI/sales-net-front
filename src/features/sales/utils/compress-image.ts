/**
 * Comprime la foto de venta en el navegador antes de subirla, para ahorrar
 * red. El backend vuelve a comprimir con los mismos parámetros, así que esto
 * no reemplaza esa validación del lado servidor.
 */

/** Lado mayor de la imagen resultante, en píxeles. */
export const MAX_LADO = 1280
/** Calidad JPEG (0-1). Con 0.5 la evidencia sigue siendo legible. */
export const CALIDAD = 0.5

export type ImagenComprimida = {
  /** Data URL completa, ej. `data:image/jpeg;base64,...`. */
  dataUrl: string
  /** Tamaño estimado del JPEG resultante, calculado desde el largo del base64. */
  bytes: number
}

/** Escala manteniendo la proporción; nunca agranda una imagen pequeña. */
function calcularTamano(ancho: number, alto: number) {
  const mayor = Math.max(ancho, alto)
  if (mayor <= MAX_LADO) return { ancho, alto }
  const ratio = MAX_LADO / mayor
  return { ancho: Math.round(ancho * ratio), alto: Math.round(alto * ratio) }
}

function dibujar(fuente: CanvasImageSource, ancho: number, alto: number): ImagenComprimida {
  const destino = calcularTamano(ancho, alto)
  const canvas = document.createElement('canvas')
  canvas.width = destino.ancho
  canvas.height = destino.alto

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(fuente, 0, 0, destino.ancho, destino.alto)

  const dataUrl = canvas.toDataURL('image/jpeg', CALIDAD)
  // El base64 pesa ~4/3 del binario; se descuenta para reportar el real.
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return { dataUrl, bytes: Math.round((base64.length * 3) / 4) }
}

/** Comprime un frame de <video> (captura en vivo desde la cámara). */
export function comprimirVideoFrame(video: HTMLVideoElement): ImagenComprimida {
  return dibujar(video, video.videoWidth, video.videoHeight)
}

/** Comprime un File del selector de archivos (fallback sin cámara). */
export function comprimirArchivo(archivo: File): Promise<ImagenComprimida> {
  return new Promise((resolve, reject) => {
    if (!archivo.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen'))
      return
    }

    const url = URL.createObjectURL(archivo)
    const imagen = new Image()

    imagen.onload = () => {
      try {
        resolve(dibujar(imagen, imagen.naturalWidth, imagen.naturalHeight))
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }

    imagen.src = url
  })
}

/** Formatea bytes para mostrarle el peso al vendedor. */
export function formatearPeso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

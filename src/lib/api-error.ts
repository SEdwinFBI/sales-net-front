import axios from 'axios'

/**
 * Extrae un mensaje legible de un error de Axios probando las formas más
 * comunes de respuesta del backend (`message`, `detail`, `error`, array de
 * errores, o el primer campo con error de validación). Cae al `fallback` si
 * no reconoce la forma o el error no viene de una petición HTTP.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') return data
    if (data.message) return String(data.message)
    if (data.detail) return String(data.detail)
    if (data.error) return String(data.error)
    if (Array.isArray(data)) return data.map(String).join('\n')
    const firstKey = Object.keys(data)[0]
    if (firstKey) {
      const value = data[firstKey]
      if (Array.isArray(value)) return `${firstKey}: ${value.join(', ')}`
      if (typeof value === 'string') return `${firstKey}: ${value}`
    }
  }
  if (error instanceof Error) return error.message
  return fallback
}

import axios from 'axios'

function readMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    const value = data.trim()
    return value && !/<\/?[a-z][^>]*>/i.test(value) ? value : undefined
  }
  if (Array.isArray(data)) {
    const messages = data.map(readMessage).filter(Boolean)
    return messages.length ? messages.join('\n') : undefined
  }
  if (!data || typeof data !== 'object') return undefined
  const fields = data as Record<string, unknown>
  for (const key of ['message', 'detail', 'error', 'data']) {
    const message = readMessage(fields[key])
    if (message) return message
  }
  for (const [key, value] of Object.entries(fields)) {
    if (['status', 'message', 'detail', 'error', 'data'].includes(key)) continue
    const message = readMessage(value)
    if (message) return `${key}: ${message}`
  }
}

/**
 * Extrae un mensaje legible de un error de Axios probando las formas más
 * comunes de respuesta del backend (`message`, `detail`, `error`, array de
 * errores, o el primer campo con error de validación). Cae al `fallback` si
 * no reconoce la forma o el error no viene de una petición HTTP.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    return readMessage(error.response.data) ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

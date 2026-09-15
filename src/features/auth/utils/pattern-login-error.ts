import axios from 'axios'
import { getApiErrorMessage } from '@/lib/api-error'

export function getPatternLoginErrorMessage(error: unknown): string {
  const fallback = 'No se pudo iniciar sesión. Intenta nuevamente.'
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.'

  const { status } = error.response
  const rawDetail = getApiErrorMessage(error, '')
  const detail = rawDetail && !/<[^>]+>/.test(rawDetail) && rawDetail !== error.message ? rawDetail : ''

  if (status === 423 || status === 429) {
    return detail
      ? `Acceso restringido por el servidor. ${detail}`
      : 'El servidor bloqueó el acceso por intentos fallidos o demasiadas solicitudes. Espera a que termine el bloqueo o consulta al administrador.'
  }
  if (status >= 500) return 'El servidor no pudo procesar el acceso. Intenta más tarde.'
  if (status === 401 || status === 403) {
    // Conserva el motivo real: puede ser un bloqueo y no un patrón incorrecto.
    return detail || 'No se pudo validar el acceso. Revisa tu usuario y patrón. Después de 5 intentos fallidos, el servidor bloquea el acceso.'
  }
  return detail || fallback
}

export function getPatternLockSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null
  const body = error.response?.data
  if (!body || (body.code !== 'patron_bloqueado' && body.data?.patron_bloqueado !== true)) return null
  const seconds = body.data?.reintentar_en_segundos
  return typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null
}

export function getPatternLockMessage(error: unknown): string {
  const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
  return typeof message === 'string' && message.trim() && !/<[^>]+>/.test(message)
    ? message
    : 'El acceso por patrón está bloqueado temporalmente. Espera a que termine el plazo para volver a intentarlo.'
}

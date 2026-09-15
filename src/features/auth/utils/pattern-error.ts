import axios from 'axios'

const labels: Record<string, string> = {
  current_password: 'Contraseña actual',
  patron: 'Patrón',
  confirmar_patron: 'Confirmación del patrón',
}

function messages(value: unknown): string[] {
  if (typeof value === 'string') {
    return /<[^>]+>/.test(value) ? [] : [value]
  }
  if (Array.isArray(value)) return value.flatMap(messages)
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      messages(entry).map((message) => labels[key] ? `${labels[key]}: ${message}` : message),
    )
  }
  return []
}

export function getPatternErrorMessage(error: unknown): string {
  const fallback = 'No se pudo guardar el patrón. Intenta nuevamente; si el problema continúa, contacta al administrador.'
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) {
    return 'No se pudo confirmar el guardado. Revisa tu conexión a internet y vuelve a intentarlo.'
  }
  const { status, data } = error.response
  if (status === 401) return 'Tu sesión no es válida o ha vencido. Inicia sesión nuevamente antes de guardar el patrón.'
  if (status === 403) return 'El servidor rechazó la autorización para guardar el patrón. Verifica tu acceso con el administrador.'
  if (status === 404 || status === 405) return 'El servicio para guardar patrones no está disponible en esta ruta. Contacta al administrador.'
  if (status === 429) return 'Se realizaron demasiados intentos. Espera unos minutos antes de volver a guardar el patrón.'
  if (status >= 500) return 'El servidor tuvo un problema y no se pudo confirmar el guardado. Intenta más tarde; si continúa, contacta al administrador.'
  const details = [...new Set(messages(data))].join('\n')
  return details ? `El servidor no aceptó la configuración:\n${details}\nRevisa los datos indicados antes de volver a guardar.` : fallback
}

import axios from 'axios'
import { getApiErrorMessage } from '@/lib/api-error'

export function getPasskeyErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'AbortError') return 'La operación se canceló o venció. Puedes volver a intentarlo o ingresar con contraseña.'
    if (error.name === 'InvalidStateError') return 'Esta passkey ya está registrada. Usa otra credencial o ingresa con la existente.'
    if (error.name === 'SecurityError') return 'No se pudo validar el dominio de la aplicación. Contacta al administrador.'
    if (error.name === 'NotSupportedError') return 'Tu dispositivo no admite esta configuración de passkeys. Usa el acceso con contraseña.'
  }
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    const seconds = Number(error.response.headers?.['retry-after'])
    if (Number.isFinite(seconds) && seconds > 0) {
      const minutes = Math.ceil(seconds / 60)
      return `Demasiados intentos. Espera ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} antes de volver a intentarlo.`
    }
    return 'Demasiados intentos. Espera e intenta nuevamente más tarde.'
  }
  return getApiErrorMessage(error, 'No se pudo completar la operación. Vuelve a intentarlo.')
}

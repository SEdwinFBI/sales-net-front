import { describe, expect, it } from 'vitest'
import { getPatternErrorMessage } from './pattern-error'

const failure = (status: number, data: unknown) => ({ isAxiosError: true, response: { status, data } })

describe('getPatternErrorMessage', () => {
  it('muestra todos los campos rechazados con nombres legibles', () => {
    const result = getPatternErrorMessage(failure(400, {
      current_password: ['Contraseña incorrecta'],
      confirmar_patron: ['Los patrones no coinciden'],
    }))
    expect(result).toContain('Contraseña actual: Contraseña incorrecta')
    expect(result).toContain('Confirmación del patrón: Los patrones no coinciden')
  })
  it('no muestra páginas HTML ni detalles internos del servidor', () => {
    for (const status of [400, 500]) {
      const result = getPatternErrorMessage(failure(status, '<html>Traceback SECRET</html>'))
      expect(result).not.toContain('SECRET')
      expect(result).not.toContain('<html>')
    }
  })
  it('distingue conexión, sesión vencida y demasiados intentos', () => {
    expect(getPatternErrorMessage({ isAxiosError: true })).toContain('conexión')
    expect(getPatternErrorMessage(failure(401, {}))).toContain('Inicia sesión')
    expect(getPatternErrorMessage(failure(429, {}))).toContain('Espera unos minutos')
  })
})

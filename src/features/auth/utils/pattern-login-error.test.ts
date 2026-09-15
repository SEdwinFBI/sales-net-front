import { describe, expect, it } from 'vitest'
import { getPatternLoginErrorMessage, getPatternLockSeconds, getPatternLockMessage } from './pattern-login-error'

const failure = (status: number, data: unknown) => ({
  isAxiosError: true, message: `Request failed with status code ${status}`, response: { status, data },
})

describe('getPatternLoginErrorMessage', () => {
  it.each([400, 401, 403, 423, 429])('conserva el mensaje de bloqueo del servidor con estado %s', (status) => {
    expect(getPatternLoginErrorMessage(failure(status, { detail: 'Acceso bloqueado. Intenta en 15 minutos.' })))
      .toContain('Acceso bloqueado. Intenta en 15 minutos.')
  })
  it('conserva los intentos restantes informados por el servidor', () => {
    expect(getPatternLoginErrorMessage(failure(401, { detail: 'Patrón incorrecto. Queda 1 intento.' })))
      .toBe('Patrón incorrecto. Queda 1 intento.')
  })
  it.each([423, 429])('no inventa la duración de un bloqueo sin detalle (%s)', (status) => {
    const message = getPatternLoginErrorMessage(failure(status, {}))
    expect(message).toContain('bloqueó')
    expect(message).not.toContain('minutos')
  })
  it('no expone HTML del servidor', () => {
    expect(getPatternLoginErrorMessage(failure(403, '<html>Traceback</html>'))).not.toContain('<html>')
  })
})

describe('getPatternLockSeconds', () => {
  it('lee el plazo enviado por el backend independientemente del estado HTTP', () => {
    expect(getPatternLockSeconds(failure(403, {
      status: 'error', code: 'patron_bloqueado',
      data: { patron_bloqueado: true, reintentar_en_segundos: 300 },
    }))).toBe(300)
  })
  it('no inventa plazos ni confunde un error común con un bloqueo', () => {
    expect(getPatternLockSeconds(failure(401, { message: 'Patrón incorrecto' }))).toBeNull()
    for (const seconds of [-1, '300', null, Infinity]) {
      expect(getPatternLockSeconds(failure(429, {
        code: 'patron_bloqueado', data: { reintentar_en_segundos: seconds },
      }))).toBeNull()
    }
  })
})

describe('getPatternLockMessage', () => {
  it('muestra el mensaje exacto del endpoint junto con su plazo', () => {
    const message = 'Has superado el maximo de 5 intentos. Intenta nuevamente en 5 minuto(s).'
    const error = failure(429, {
      status: 'error', code: 'patron_bloqueado', message,
      data: { patron_bloqueado: true, reintentar_en_segundos: 300 },
    })
    expect(getPatternLockMessage(error)).toBe(message)
    expect(getPatternLockSeconds(error)).toBe(300)
  })
})

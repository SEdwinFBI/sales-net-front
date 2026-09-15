import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { getPatternLockMessage, getPatternLockSeconds } from '../utils/pattern-login-error'
import { api } from '@/lib/api'
import { createPatternService, loginPatternService } from './auth-service'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }))

const payload = {
  current_password: ' test-password ',
  patron: [1, 2, 5, 8, 9],
  confirmar_patron: [1, 2, 5, 8, 9],
}

describe('createPatternService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('convierte ambos patrones de 1–9 a 0–8 sin modificar la contraseña ni el original', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201 })
    await createPatternService(payload)
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/auth/patron/', {
      current_password: payload.current_password,
      patron: [0, 1, 4, 7, 8],
      confirmar_patron: [0, 1, 4, 7, 8],
    })
    expect(payload.patron).toEqual([1, 2, 5, 8, 9])
    expect(payload.confirmar_patron).toEqual([1, 2, 5, 8, 9])
  })

  it('propaga el rechazo del servidor para que el formulario no muestre éxito', async () => {
    const error = new Error('Contraseña incorrecta')
    vi.mocked(api.post).mockRejectedValue(error)
    await expect(createPatternService(payload)).rejects.toBe(error)
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})

describe('loginPatternService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    { access: 'access', refresh: 'refresh', user: { id: 1 } },
    { requiere_seleccion_sucursal: true, pre_token: 'pre-token', sucursales: [{ id: 1, nombre: 'Principal' }] },
  ])('envía usuario y patrón 0–8 y conserva la respuesta de sesión o sucursales', async (data) => {
    vi.mocked(api.post).mockResolvedValue({ data })
    const patron = [1, 2, 3, 6, 9, 8]
    await expect(loginPatternService({ username: ' vendedor ', patron })).resolves.toEqual(data)
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/auth/login/patron/', {
      username: 'vendedor', patron: [0, 1, 2, 5, 8, 7],
    })
    expect(patron).toEqual([1, 2, 3, 6, 9, 8])
  })

  it('propaga credenciales rechazadas sin reintentar', async () => {
    const error = new Error('Patrón incorrecto')
    vi.mocked(api.post).mockRejectedValue(error)
    await expect(loginPatternService({ username: 'vendedor', patron: [1, 2, 3, 6, 9, 8] })).rejects.toBe(error)
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})

describe('bloqueo del login por patrón', () => {
  const body = {
    status: 'error', code: 'patron_bloqueado',
    message: 'Has superado el maximo de 5 intentos. Intenta nuevamente en 5 minuto(s).',
    data: { patron_bloqueado: true, reintentar_en_segundos: 300 },
  }

  it.each([200, 403, 429])('entrega a la interfaz el bloqueo y los 300 segundos con HTTP %s', async (status) => {
    const response = { status, data: body, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } }
    if (status === 200) vi.mocked(api.post).mockResolvedValue(response)
    else vi.mocked(api.post).mockRejectedValue(new AxiosError('Acceso bloqueado', undefined, undefined, undefined, response))
    const result = await loginPatternService({ username: 'vendedor', patron: [1, 2, 3, 6, 9, 8] })
      .then(() => { throw new Error('El bloqueo no debe iniciar sesión') }, (error: unknown) => error)
    expect(getPatternLockSeconds(result)).toBe(300)
    expect(getPatternLockMessage(result)).toBe(body.message)
  })
})

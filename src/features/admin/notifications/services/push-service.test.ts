import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { activarPush, desactivarPush, estadoPush, esperaLlamado, llamarAdministrador } from './push-service'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const suscripcion = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'k', auth: 'a' } }),
  unsubscribe: vi.fn(async () => true),
}

function simularNavegador({ suscrito = false, permiso = 'default' as NotificationPermission, concede = true } = {}) {
  const pushManager = {
    getSubscription: vi.fn(async () => (suscrito ? suscripcion : null)),
    subscribe: vi.fn(async () => suscripcion),
  }
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal('Notification', { permission: permiso, requestPermission: vi.fn(async () => (concede ? 'granted' : 'denied')) })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: vi.fn(async () => ({ pushManager })) },
  })
  return pushManager
}

const respuesta = (public_key: string | null, suscrito = false) => ({ data: { status: 'success', data: { public_key, suscrito } } })

describe('avisos push en el telefono', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })

  it('el vendedor consulta la espera y avisa al administrador', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'success', data: { espera: 120 } } })
    expect(await esperaLlamado()).toBe(120)
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'success', data: { enviados: 2, espera: 300 } } })
    expect(await llamarAdministrador()).toEqual({ enviados: 2, espera: 300 })
    expect(api.post).toHaveBeenCalledWith('/presence/push/llamado/')
  })

  it('sin service worker (p. ej. en desarrollo) no esta disponible', async () => {
    expect(await estadoPush()).toBe('no_soportado')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('sin claves en el servidor avisa que falta configurar', async () => {
    simularNavegador()
    vi.mocked(api.get).mockResolvedValue(respuesta(null))
    expect(await estadoPush()).toBe('sin_configurar')
    expect(await activarPush()).toBe('sin_configurar')
  })

  it('activar: pide permiso, suscribe con la clave publica y lo registra en el servidor', async () => {
    const pushManager = simularNavegador()
    vi.mocked(api.get).mockResolvedValue(respuesta('BAEC'))
    expect(await activarPush()).toBe('activo')
    expect(pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) })
    expect(api.post).toHaveBeenCalledWith('/presence/push/', suscripcion.toJSON())
  })

  it('permiso rechazado: bloqueado, sin suscribir', async () => {
    const pushManager = simularNavegador({ concede: false })
    vi.mocked(api.get).mockResolvedValue(respuesta('BAEC'))
    expect(await activarPush()).toBe('bloqueado')
    expect(pushManager.subscribe).not.toHaveBeenCalled()
  })

  it('estado activo solo si el telefono y el servidor lo tienen; desactivar borra ambos', async () => {
    simularNavegador({ suscrito: true, permiso: 'granted' })
    vi.mocked(api.get).mockResolvedValue(respuesta('BAEC', true))
    expect(await estadoPush()).toBe('activo')
    expect(await desactivarPush()).toBe('inactivo')
    expect(api.delete).toHaveBeenCalledWith('/presence/push/', { data: { endpoint: suscripcion.endpoint } })
    expect(suscripcion.unsubscribe).toHaveBeenCalled()
  })
})

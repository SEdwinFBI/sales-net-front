import { api } from '@/lib/api'

const ENDPOINT = '/presence/push/'

type ApiResponse<T> = { status: 'success' | 'error'; data: T }

/**
 * Estado de los avisos push en este teléfono:
 * - `no_soportado`: el navegador no tiene push o la app no tiene service worker (p. ej. en desarrollo).
 * - `sin_configurar`: faltan las claves VAPID en el servidor.
 * - `bloqueado`: el usuario rechazó las notificaciones; solo se reactiva desde los ajustes del teléfono.
 */
export type EstadoPush = 'no_soportado' | 'sin_configurar' | 'bloqueado' | 'activo' | 'inactivo'

async function registroSw(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in globalThis) || !('Notification' in globalThis)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

/** La clave VAPID llega en base64url; el navegador la pide en bytes. */
function claveABytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4)
  const binario = atob((base64url + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binario.length))
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

async function config(endpoint?: string) {
  const { data } = await api.get<ApiResponse<{ public_key: string | null; suscrito: boolean }>>(ENDPOINT, {
    params: endpoint ? { endpoint } : undefined,
  })
  return data.data
}

export async function estadoPush(): Promise<EstadoPush> {
  const registro = await registroSw()
  if (!registro) return 'no_soportado'
  const actual = await registro.pushManager.getSubscription()
  const { public_key, suscrito } = await config(actual?.endpoint)
  if (!public_key) return 'sin_configurar'
  if (Notification.permission === 'denied') return 'bloqueado'
  return actual && suscrito ? 'activo' : 'inactivo'
}

/** Pide el permiso (si hace falta), suscribe este teléfono y lo registra en el servidor. */
export async function activarPush(): Promise<EstadoPush> {
  const registro = await registroSw()
  if (!registro) return 'no_soportado'
  const { public_key } = await config()
  if (!public_key) return 'sin_configurar'
  if ((await Notification.requestPermission()) !== 'granted') return 'bloqueado'
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(public_key) }))
  await api.post(ENDPOINT, suscripcion.toJSON())
  return 'activo'
}

export async function desactivarPush(): Promise<EstadoPush> {
  const registro = await registroSw()
  const suscripcion = await registro?.pushManager.getSubscription()
  if (suscripcion) {
    await api.delete(ENDPOINT, { data: { endpoint: suscripcion.endpoint } })
    await suscripcion.unsubscribe()
  }
  return 'inactivo'
}

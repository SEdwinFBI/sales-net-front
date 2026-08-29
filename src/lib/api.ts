import axios from 'axios'
import type { AxiosError } from 'axios'
import { useAuthStore, isTokenExpired } from '@/features/core/store/auth-store'
import { toast } from 'sonner'
import type { AuthSession } from '@/features/auth/types/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Deriva el origen ws(s):// a partir de VITE_API_URL para  websockets. */
function getWsOrigin(): string {
  const url = new URL(import.meta.env.VITE_API_URL, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/'
  url.search = ''
  return url.toString().replace(/\/$/, '')
}

export function buildWsUrl(path: string, token: string): string {
  return `${getWsOrigin()}${path}?token=${encodeURIComponent(token)}`
}

let isRefreshing = false
/** Peticiones que esperan un refresh de token ya en curso, para no disparar varios refresh en paralelo. */
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

/** Resuelve o rechaza todas las peticiones en espera con el resultado del refresh en curso. */
function processQueue(error: unknown | null, token: string | null = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error ?? new Error('Refresh failed'))
    } else {
      resolve(token)
    }
  })
  pendingQueue = []
}

/** Pide un access token nuevo con el refresh token y actualiza la sesión guardada. */
async function refreshAuth(): Promise<string> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) throw new Error('No refresh token available')

  const { data } = await api.post<AuthSession>('/auth/refresh/', { refresh: refreshToken })
  useAuthStore.getState().login(data)
  return data.access
}

// Renueva el access token antes de que expire. Si ya hay un refresh en
// curso, encola la petición en vez de disparar otro refresh en paralelo.
api.interceptors.request.use((config) => {
  if (config.url?.includes('/auth/refresh/')) return config

  const { token, tokenExpiresAt } = useAuthStore.getState()

  if (isTokenExpired(tokenExpiresAt)) {
    if (isRefreshing) {
      return new Promise<typeof config>((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            config.headers.Authorization = `Bearer ${newToken}`
            resolve(config)
          },
          reject,
        })
      })
    }

    isRefreshing = true

    return refreshAuth().then(
      (newToken) => {
        processQueue(null, newToken)
        config.headers.Authorization = `Bearer ${newToken}`
        return config
      },
      (error) => {
        processQueue(error)
        useAuthStore.getState().logout()
        toast.error('Tu sesion ha caducado, por favor inicia sesion nuevamente')
        return Promise.reject(error)
      },
    ).finally(() => {
      isRefreshing = false
    })
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Si una petición falla con 401/419 (token vencido en el servidor pese a no
// haber expirado localmente), reintenta una sola vez tras refrescar el token.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!axios.isAxiosError(error) || !error.config) return Promise.reject(error)

    const originalRequest = error.config
    const status = error.response?.status

    if ((status !== 401 && status !== 419) || originalRequest.url?.includes('/auth/refresh/')) {
      if (status === 401 || status === 419) {
        useAuthStore.getState().logout()
      }
      return Promise.reject(error)
    }

    if ((originalRequest as unknown as Record<string, unknown>)._retry) {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }
    ;(originalRequest as unknown as Record<string, unknown>)._retry = true

    if (isRefreshing) {
      return new Promise<ReturnType<typeof api>>((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAuth()
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

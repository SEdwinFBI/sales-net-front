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

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

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

async function refreshAuth(): Promise<string> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) throw new Error('No refresh token available')

  const { data } = await api.post<AuthSession>('/auth/refresh/', { refresh: refreshToken })
  useAuthStore.getState().login(data)
  return data.access
}

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

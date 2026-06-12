import axios from 'axios'
import { useAuthStore, isTokenExpired } from '@/features/core/store/auth-store'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { token, tokenExpiresAt } = useAuthStore.getState()

  if (isTokenExpired(tokenExpiresAt)) {
    useAuthStore.getState().logout()
    toast.success(`Tu session a caducado, por favor inicia sesión nuevamente`)
    return Promise.reject(new Error('Token expirado'))
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      if (status === 401 || status === 419) {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  },
)

import axios from 'axios'
import { useAuthStore, isTokenExpired } from '@/store/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const expiresAt = useAuthStore.getState().tokenExpiresAt

  // Si el token está expirado
  if (isTokenExpired(expiresAt)) {
    useAuthStore.getState().logout()
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

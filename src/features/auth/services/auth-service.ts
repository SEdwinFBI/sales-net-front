
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'

export async function loginService(credentials: AuthCredentials): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/login/', credentials)
  return data
}

export async function logoutService(refresh: string): Promise<void> {
  await api.post('/auth/logout/', { refresh })
}

export async function refreshService(refresh: string): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/refresh/', { refresh })
  return data
}

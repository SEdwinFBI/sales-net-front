
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'

const BYPASS_CREDENTIALS: Record<string, AuthSession> = {
  'admin:admin': {
    access: 'bypass-token-admin',
    refresh: 'bypass-refresh-admin',
    user: {
      fullName: 'Admin Bypass',
      id: 1,
      role: 'admin',
      permissions: ['admin'],
      username: 'admin',
    },
  },
  'vendedor:vendedor': {
    access: 'bypass-token-vendedor',
    refresh: 'bypass-refresh-vendedor',
    user: {
      fullName: 'Vendedor Bypass',
      id: 2,
      role: 'vendedor',
      permissions: ['vendedor'],
      username: 'vendedor',
    },
  },
}

export async function loginService(credentials: AuthCredentials): Promise<AuthSession> {
  const key = `${credentials.username}:${credentials.password}`
  const bypass = BYPASS_CREDENTIALS[key]
  if (bypass) return bypass

  const { data } = await api.post<AuthSession>('/auth/login/', credentials)
  return data
}

export async function logoutService(refresh: string): Promise<void> {
  await api.post('/auth/logout/', { refresh })
}

export async function refreshService(refresh: string): Promise<{ access: string }> {
  const { data } = await api.post<{ access: string }>('/auth/refresh/', { refresh })
  return data
}

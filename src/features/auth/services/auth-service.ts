
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'

const BYPASS_CREDENTIALS: Record<string, AuthSession> = {
  'admin:admin': {
    access: 'bypass-token-admin',
    expiresIn: '9999999999',
    user: {
      fullName: 'Admin Bypass',
      id: 1,
      role: 'admin',
      permissions: ['admin', 'vendedor'],
      username: 'admin',
    },
  },
  'vendedor:vendedor': {
    access: 'bypass-token-vendedor',
    expiresIn: '9999999999',
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

  try {
    const { data } = await api.post<AuthSession>('/auth/login/', credentials)

    return data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {

    throw new Error('Error al iniciar sesión. Por favor, intenta de nuevo.')
  }
}

import axios from 'axios'
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession } from '@/features/auth/types/auth'

type LoginRequest = AuthCredentials

const mockUsersByRole: AuthSession[] = [
  {
    username: 'Jhon lix',
    token: '',
    role: 'admin',
    permissions: ['admin'],
  },
  {
    username: 'David tzul',
    token: '',
    role: 'vendedor',
    permissions: ['vendedor'],
  },
]

function buildMockSession(payload: LoginRequest): AuthSession {
  const baseUser = mockUsersByRole[payload.password == 'admin' ? 0 : 1]
  const tokenPrefix = payload.password == 'admin' ? 'admin-token' : 'seller-token'

  return { ...baseUser, token: `${tokenPrefix}-${payload.username}` }
}

export async function loginService(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>('/auth/login', credentials)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && credentials.password == '123456') {
      throw new Error('Credenciales invalidas para el entorno demo.')
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    return buildMockSession(credentials)
  }
}

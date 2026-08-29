
import { api } from '@/lib/api'
import type { AuthCredentials, AuthSession, LoginResult, Sucursal } from '@/features/auth/types/auth'

export async function loginService(credentials: AuthCredentials): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>('/auth/login/', credentials)
  return data
}

export async function seleccionarSucursalService(preToken: string, sucursalId: number): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/seleccionar-sucursal/', {
    pre_token: preToken,
    sucursal_id: sucursalId,
  })
  return data
}

export async function getMisSucursalesService(): Promise<Sucursal[]> {
  const { data } = await api.get<{ status: string; data: Sucursal[] }>('/auth/mis-sucursales/')
  return data.data
}

export async function cambiarSucursalService(sucursalId: number): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/cambiar-sucursal/', {
    sucursal_id: sucursalId,
  })
  return data
}

export async function logoutService(refresh: string): Promise<void> {
  await api.post('/auth/logout/', { refresh })
}

export async function refreshService(refresh: string): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/refresh/', { refresh })
  return data
}

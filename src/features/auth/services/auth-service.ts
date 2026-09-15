
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import type { CreatePatternPayload, PatternLoginCredentials } from '../types/pattern'
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

export async function createPatternService(payload: CreatePatternPayload): Promise<void> {
  // La cuadrícula usa puntos 1–9; la API recibe índices 0–8.
  await api.post('/auth/patron/', {
    ...payload,
    patron: payload.patron.map((node) => node - 1),
    confirmar_patron: payload.confirmar_patron.map((node) => node - 1),
  })
}

export async function loginPatternService(credentials: PatternLoginCredentials): Promise<LoginResult> {
  const response = await api.post<LoginResult & { status?: string; code?: string; message?: string; data?: { patron_bloqueado?: boolean } }>('/auth/login/patron/', {
    username: credentials.username.trim(),
    patron: credentials.patron.map((node) => node - 1),
  })
  const { data } = response
  // Algunos servidores devuelven errores de negocio con HTTP 200.
  if (data.status === 'error' || data.code === 'patron_bloqueado' || data.data?.patron_bloqueado === true) {
    throw new AxiosError(data.message || 'No se pudo iniciar sesión', 'ERR_BAD_RESPONSE', response.config, response.request, response)
  }
  return data
}

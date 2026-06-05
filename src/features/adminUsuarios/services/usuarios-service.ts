import { api } from '@/lib/api'
import type { Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from '../types/usuario-types'

interface UserApi {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string | null
  is_active: boolean
  created_at: string
}

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
}

interface PaginatedData<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const mapUser = (u: UserApi): Usuario => ({
  ...u,
  fullName: `${u.first_name} ${u.last_name}`.trim(),
})

export const getUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await api.get<ApiResponse<PaginatedData<UserApi>>>('/auth/usuarios/')
  return data.data.results.map(mapUser)
}

export const getUsuarioById = async (id: number): Promise<Usuario> => {
  const { data } = await api.get<ApiResponse<UserApi>>(`/auth/usuarios/${id}/`)
  return mapUser(data.data)
}

export const createUsuario = async (payload: CreateUsuarioPayload): Promise<Usuario> => {
  const { data } = await api.post<ApiResponse<UserApi>>('/auth/usuarios/', payload)
  return mapUser(data.data)
}

export const updateUsuario = async (payload: UpdateUsuarioPayload): Promise<Usuario> => {
  const { data } = await api.put<ApiResponse<UserApi>>(`/auth/usuarios/${payload.id}/`, payload)
  return mapUser(data.data)
}

export const deleteUsuario = async (id: number): Promise<void> => {
  await api.delete(`/auth/usuarios/${id}/`)
}

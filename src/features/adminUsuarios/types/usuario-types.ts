import type { AppRole } from '@/features/auth/types/auth'

export type Usuario = {
  id: string
  fullName: string
  username: string
  role: AppRole
}

export type CreateUsuarioPayload = {
  fullName: string
  username: string
  password: string
  role: AppRole
}

export type UpdateUsuarioPayload = {
  id: string
  fullName: string
  username: string
  password?: string
  role: AppRole
}
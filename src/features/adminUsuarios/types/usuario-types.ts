export type Usuario = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  fullName: string
  role: string | null
  is_active: boolean
  created_at: string
}

export type CreateUsuarioPayload = {
  username: string
  password: string
  first_name: string
  last_name: string
  email?: string
  role?: string
}

export type UpdateUsuarioPayload = {
  id: number
  username?: string
  password?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
}
